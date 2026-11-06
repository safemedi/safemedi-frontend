import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { queryKeys } from "@/api/query-keys";
import type { TodayMedicationSchedulesResponse } from "@/api/types/dashboard";
import type { PrescriptionListItem, PrescriptionsListResponse } from "@/api/types/prescriptions";
import { useMarkMedicationRecordsMutation } from "../dashboard";
import { useUpdatePrescriptionMutation } from "../prescriptions";

const mockUpdateRecords = jest.fn();
jest.mock("@/api/endpoints/dashboard", () => ({
  updateMedicationRecords: (...args: unknown[]) => mockUpdateRecords(...args),
}));
const mockUpdatePrescription = jest.fn();
jest.mock("@/api/endpoints/prescriptions", () => ({
  updatePrescription: (...args: unknown[]) => mockUpdatePrescription(...args),
}));
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const schedules: TodayMedicationSchedulesResponse = {
  date: "2026-11-05",
  summary: { totalCount: 2, completedCount: 0, completionRate: 0 },
  schedules: [1, 2].map((id) => ({
    prescriptionId: id,
    prescriptionTitle: `처방전${id}`,
    takeTime: "08:00",
    drugCount: 1,
    recordIds: [id],
    displayStatus: "NEED_TAKE",
  })),
};
function setup() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  function wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return { client, wrapper };
}

beforeEach(() => {
  jest.clearAllMocks();
});
it("처방전 이름을 목록·상세·홈에 즉시 반영하고 실패 시 복약 상태를 보존하며 이름만 복구한다", async () => {
  const { client, wrapper } = setup();
  const prescription: PrescriptionListItem = {
    prescriptionId: 1,
    title: "처방전1",
    medications: [],
  };
  client.setQueryData(queryKeys.prescriptions.list, { prescriptions: [prescription] });
  client.setQueryData(queryKeys.prescriptions.detail(1), prescription);
  client.setQueryData(queryKeys.dashboard.todayMedicationSchedules, schedules);
  const request = deferred<unknown>();
  mockUpdatePrescription.mockReturnValue(request.promise);
  const { result } = renderHook(() => useUpdatePrescriptionMutation(), { wrapper });
  let pending!: Promise<unknown>;
  await act(async () => {
    pending = result.current
      .mutateAsync({ prescriptionId: 1, body: { title: "새 이름" } })
      .catch(() => undefined);
  });
  expect(
    client.getQueryData<PrescriptionsListResponse>(queryKeys.prescriptions.list)?.prescriptions[0]
      .title,
  ).toBe("새 이름");
  expect(client.getQueryData<PrescriptionListItem>(queryKeys.prescriptions.detail(1))?.title).toBe(
    "새 이름",
  );
  const current = client.getQueryData<TodayMedicationSchedulesResponse>(
    queryKeys.dashboard.todayMedicationSchedules,
  );
  expect(current?.schedules[0].prescriptionTitle).toBe("새 이름");
  client.setQueryData<TodayMedicationSchedulesResponse>(
    queryKeys.dashboard.todayMedicationSchedules,
    (data) =>
      data && {
        ...data,
        schedules: data.schedules.map((item) => ({ ...item, displayStatus: "SUCCESS" })),
      },
  );
  await act(async () => {
    request.reject(new Error("실패"));
    await pending;
  });
  expect(client.getQueryData<PrescriptionListItem>(queryKeys.prescriptions.detail(1))?.title).toBe(
    "처방전1",
  );
  expect(
    client.getQueryData<TodayMedicationSchedulesResponse>(
      queryKeys.dashboard.todayMedicationSchedules,
    )?.schedules[0],
  ).toMatchObject({ prescriptionTitle: "처방전1", displayStatus: "SUCCESS" });
  client.clear();
});

it("처방전 수정과 복약 처리가 동시에 끝나도 최종 일정을 한 번 재조회한다", async () => {
  const { client, wrapper } = setup();
  client.setQueryData(queryKeys.dashboard.todayMedicationSchedules, schedules);
  const recordRequest = deferred<unknown>();
  const titleRequest = deferred<unknown>();
  mockUpdateRecords.mockReturnValue(recordRequest.promise);
  mockUpdatePrescription.mockReturnValue(titleRequest.promise);
  const invalidate = jest.spyOn(client, "invalidateQueries");
  const { result } = renderHook(
    () => ({ records: useMarkMedicationRecordsMutation(), title: useUpdatePrescriptionMutation() }),
    { wrapper },
  );
  let recordPending!: Promise<unknown>;
  let titlePending!: Promise<unknown>;
  await act(async () => {
    recordPending = result.current.records.mutateAsync({ recordIds: [1], status: "SUCCESS" });
    titlePending = result.current.title.mutateAsync({
      prescriptionId: 1,
      body: { title: "새 이름" },
    });
  });
  await act(async () => {
    recordRequest.resolve({});
    titleRequest.resolve({});
    await Promise.all([recordPending, titlePending]);
  });
  expect(
    invalidate.mock.calls.filter(
      ([filter]) => filter?.queryKey === queryKeys.dashboard.todayMedicationSchedules,
    ),
  ).toHaveLength(1);
  expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.medications.all });
  client.clear();
});
