import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import type { TodayMedicationSchedulesResponse } from "@/api/types/dashboard";
import type { PrescriptionListItem, PrescriptionsListResponse } from "@/api/types/prescriptions";

export async function updatePrescriptionTitleOptimistically(
  client: QueryClient,
  prescriptionId: number,
  title: string,
) {
  const listKey = queryKeys.prescriptions.list;
  const detailKey = queryKeys.prescriptions.detail(prescriptionId);
  const todayKey = queryKeys.dashboard.todayMedicationSchedules;
  await Promise.all(
    [listKey, detailKey, todayKey].map((queryKey) => client.cancelQueries({ queryKey })),
  );
  const list = client.getQueryData<PrescriptionsListResponse>(listKey);
  const detail = client.getQueryData<PrescriptionListItem>(detailKey);
  const today = client.getQueryData<TodayMedicationSchedulesResponse>(todayKey);
  client.setQueryData<PrescriptionsListResponse>(
    listKey,
    (current) =>
      current && {
        ...current,
        prescriptions: current.prescriptions.map((item) =>
          item.prescriptionId === prescriptionId ? { ...item, title } : item,
        ),
      },
  );
  client.setQueryData<PrescriptionListItem>(
    detailKey,
    (current) => current && { ...current, title },
  );
  client.setQueryData<TodayMedicationSchedulesResponse>(
    todayKey,
    (current) =>
      current && {
        ...current,
        schedules: current.schedules.map((item) =>
          item.prescriptionId === prescriptionId ? { ...item, prescriptionTitle: title } : item,
        ),
      },
  );
  return () => {
    client.setQueryData<PrescriptionsListResponse>(
      listKey,
      (current) =>
        current && {
          ...current,
          prescriptions: current.prescriptions.map((item) => {
            const original = list?.prescriptions.find(
              (entry) => entry.prescriptionId === prescriptionId,
            );
            return item.prescriptionId === prescriptionId && item.title === title && original
              ? { ...item, title: original.title }
              : item;
          }),
        },
    );
    client.setQueryData<PrescriptionListItem>(detailKey, (current) =>
      current && detail && current.title === title ? { ...current, title: detail.title } : current,
    );
    client.setQueryData<TodayMedicationSchedulesResponse>(
      todayKey,
      (current) =>
        current && {
          ...current,
          schedules: current.schedules.map((item) => {
            const original = today?.schedules.find(
              (entry) => entry.prescriptionId === prescriptionId,
            );
            return item.prescriptionId === prescriptionId &&
              item.prescriptionTitle === title &&
              original
              ? { ...item, prescriptionTitle: original.prescriptionTitle }
              : item;
          }),
        },
    );
  };
}
