import { useMemo, useState } from "react";
import { Alert } from "react-native";

import { getApiErrorMessage } from "@/api/error";
import {
  useDashboardTodayMedicationSchedules,
  useMarkMedicationRecordsMutation,
} from "@/api/queries/dashboard";
import { usePrescriptionsQuery } from "@/api/queries/prescriptions";
import type { TodayMedicationScheduleItem, TodayMedicationScheduleStatus } from "@/api/types";

type DashboardScheduleTone = "success" | "required" | "missed" | "upcoming";

export interface DashboardSchedulePrescriptionItem {
  readonly id: string;
  readonly prescriptionId: number;
  readonly prescriptionTitle: string;
  readonly medicationCount: number;
  readonly medicationNames: readonly string[];
  readonly recordIds: readonly number[];
  readonly canMarkAsTaken: boolean;
  readonly tone: DashboardScheduleTone;
}

export interface DashboardScheduleCardItem {
  readonly id: string;
  readonly scheduledTime: string;
  readonly prescriptionCount: number;
  readonly prescriptions: readonly DashboardSchedulePrescriptionItem[];
  readonly statusLabel: string;
  readonly tone: DashboardScheduleTone;
}

export interface DashboardRecentPrescriptionItem {
  readonly id: string;
  readonly prescriptionId: number;
  readonly dateLabel: string;
  readonly analysisCount: number;
  readonly hasWarning: boolean;
}

export interface DashboardViewModel {
  readonly adherenceRate: number;
  readonly adherenceSummaryText: string;
  readonly scheduleRemainingCount: number;
  readonly scheduleCards: readonly DashboardScheduleCardItem[];
  readonly recentPrescriptions: readonly DashboardRecentPrescriptionItem[];
  readonly healthTipTitle: string;
  readonly healthTipDescription: string;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly takingPrescriptionId: string | null;
  readonly markPrescriptionAsTaken: (prescription: DashboardSchedulePrescriptionItem) => void;
  readonly refetch: () => Promise<unknown>;
}

function resolveScheduleTone(status: TodayMedicationScheduleStatus): DashboardScheduleTone {
  if (status === "SUCCESS") return "success";
  if (status === "NEED_TAKE") return "required";
  if (status === "MISSED") return "missed";
  return "upcoming";
}

function resolvePrescriptionTone(
  status: TodayMedicationScheduleStatus,
  groupStatus: TodayMedicationScheduleStatus,
  canMarkAsTaken: boolean,
): DashboardScheduleTone {
  if (groupStatus === "NEED_TAKE" && status === "NEED_TAKE" && !canMarkAsTaken) {
    return "success";
  }

  return resolveScheduleTone(status);
}

function resolveStatusLabel(status: TodayMedicationScheduleStatus): string {
  if (status === "SUCCESS") return "완료";
  if (status === "NEED_TAKE") return "복용 필요";
  if (status === "MISSED") return "미복용";
  if (status === "SKIP") return "건너뜀";
  return "대기중";
}

function getScheduleStatus(status?: TodayMedicationScheduleStatus): TodayMedicationScheduleStatus {
  return status ?? "WAITING";
}

function resolveGroupStatus(
  statuses: readonly TodayMedicationScheduleStatus[],
): TodayMedicationScheduleStatus {
  if (statuses.some((status) => status === "NEED_TAKE")) return "NEED_TAKE";
  if (statuses.some((status) => status === "MISSED")) return "MISSED";
  if (statuses.some((status) => status === "WAITING")) return "WAITING";
  if (statuses.some((status) => status === "SKIP")) return "SKIP";
  return "SUCCESS";
}

interface PrescriptionScheduleGroup {
  readonly prescriptionId: number;
  readonly prescriptionTitle: string;
  readonly drugCount: number;
  readonly drugNames: readonly string[] | undefined;
  readonly recordIds: readonly number[];
  readonly markableRecordIds: readonly number[];
  readonly status: TodayMedicationScheduleStatus;
  readonly takeTime: string;
}

function uniqueNumbers(values: readonly number[]): number[] {
  return Array.from(new Set(values));
}

function uniqueTexts(values: readonly string[]): string[] {
  return Array.from(new Set(values));
}

function mergeDrugNames(
  currentDrugNames: readonly string[] | undefined,
  nextDrugNames: readonly string[] | undefined,
): readonly string[] | undefined {
  const mergedNames = uniqueTexts([...(currentDrugNames ?? []), ...(nextDrugNames ?? [])]);
  return mergedNames.length > 0 ? mergedNames : undefined;
}

function groupSchedulesByPrescription(
  schedules: readonly TodayMedicationScheduleItem[],
): readonly PrescriptionScheduleGroup[] {
  const groups = new Map<
    string,
    PrescriptionScheduleGroup & { statuses: TodayMedicationScheduleStatus[] }
  >();

  schedules.forEach((schedule) => {
    const key = `${schedule.prescriptionId}-${schedule.takeTime}`;
    const scheduleStatus = getScheduleStatus(schedule.displayStatus ?? schedule.status);
    const existingGroup = groups.get(key);
    const nextRecordIds = schedule.recordIds;
    const nextMarkableRecordIds = scheduleStatus === "NEED_TAKE" ? schedule.recordIds : [];

    if (existingGroup) {
      const statuses = [...existingGroup.statuses, scheduleStatus];
      groups.set(key, {
        ...existingGroup,
        drugCount: existingGroup.drugCount + schedule.drugCount,
        drugNames: mergeDrugNames(existingGroup.drugNames, schedule.drugNames),
        recordIds: uniqueNumbers([...existingGroup.recordIds, ...nextRecordIds]),
        markableRecordIds: uniqueNumbers([
          ...existingGroup.markableRecordIds,
          ...nextMarkableRecordIds,
        ]),
        status: resolveGroupStatus(statuses),
        statuses,
      });
      return;
    }

    groups.set(key, {
      prescriptionId: schedule.prescriptionId,
      prescriptionTitle: schedule.prescriptionTitle,
      drugCount: schedule.drugCount,
      drugNames: schedule.drugNames,
      recordIds: uniqueNumbers(nextRecordIds),
      markableRecordIds: uniqueNumbers(nextMarkableRecordIds),
      status: scheduleStatus,
      takeTime: schedule.takeTime,
      statuses: [scheduleStatus],
    });
  });

  return Array.from(groups.values()).map(({ statuses: _statuses, ...group }) => group);
}

export function useDashboardViewModel(): DashboardViewModel {
  const todayScheduleQuery = useDashboardTodayMedicationSchedules();
  const markMedicationRecordsMutation = useMarkMedicationRecordsMutation();
  const prescriptionsQuery = usePrescriptionsQuery();
  const [takingPrescriptionId, setTakingPrescriptionId] = useState<string | null>(null);
  const prescriptions = prescriptionsQuery.data?.prescriptions ?? [];

  const adherenceRate = Math.round(todayScheduleQuery.data?.summary.completionRate ?? 0);
  const adherenceSummaryText = todayScheduleQuery.data?.summary
    ? `${todayScheduleQuery.data.summary.completedCount} / ${todayScheduleQuery.data.summary.totalCount} 완료`
    : "0 / 0 완료";

  const scheduleCards = useMemo<readonly DashboardScheduleCardItem[]>(() => {
    if (!todayScheduleQuery.data) return [];
    const groupedSchedules = new Map<string, typeof todayScheduleQuery.data.schedules>();

    todayScheduleQuery.data.schedules.forEach((schedule) => {
      const schedules = groupedSchedules.get(schedule.takeTime) ?? [];
      groupedSchedules.set(schedule.takeTime, [...schedules, schedule]);
    });

    return Array.from(groupedSchedules.entries()).map(([takeTime, schedules]) => {
      const prescriptionSchedules = groupSchedulesByPrescription(schedules);
      const statuses = prescriptionSchedules.map((schedule) => schedule.status);
      const groupStatus = resolveGroupStatus(statuses);

      return {
        id: takeTime,
        scheduledTime: takeTime,
        prescriptionCount: prescriptionSchedules.length,
        prescriptions: prescriptionSchedules.map((schedule) => {
          const canMarkAsTaken =
            schedule.status === "NEED_TAKE" && schedule.markableRecordIds.length > 0;

          return {
            id: `${schedule.prescriptionId}-${schedule.takeTime}-${schedule.recordIds.join("-")}`,
            prescriptionId: schedule.prescriptionId,
            prescriptionTitle: schedule.prescriptionTitle,
            medicationCount: schedule.drugCount,
            medicationNames:
              schedule.drugNames ??
              prescriptions
                .find((prescription) => prescription.prescriptionId === schedule.prescriptionId)
                ?.medications.filter((medication) =>
                  medication.takeTimes.includes(schedule.takeTime),
                )
                .map((medication) => medication.drugName) ??
              [],
            recordIds: schedule.markableRecordIds,
            canMarkAsTaken,
            tone: resolvePrescriptionTone(schedule.status, groupStatus, canMarkAsTaken),
          };
        }),
        statusLabel: resolveStatusLabel(groupStatus),
        tone: resolveScheduleTone(groupStatus),
      };
    });
  }, [prescriptions, todayScheduleQuery.data]);

  const scheduleRemainingCount = useMemo(() => {
    return scheduleCards.filter((card) => card.tone !== "success").length;
  }, [scheduleCards]);

  const recentPrescriptions = useMemo<readonly DashboardRecentPrescriptionItem[]>(() => {
    return prescriptions.slice(0, 3).map((prescription) => ({
      id: String(prescription.prescriptionId),
      prescriptionId: prescription.prescriptionId,
      dateLabel: prescription.title,
      analysisCount: prescription.drugCount ?? prescription.medications.length,
      hasWarning:
        prescription.hasAllergyConflict ?? prescription.medications.some((item) => item.hasWarning),
    }));
  }, [prescriptions]);

  const refetch = async () =>
    Promise.all([todayScheduleQuery.refetch(), prescriptionsQuery.refetch()]);

  const markPrescriptionAsTaken = (prescription: DashboardSchedulePrescriptionItem) => {
    if (!prescription.canMarkAsTaken || takingPrescriptionId !== null) return;

    setTakingPrescriptionId(prescription.id);
    void markMedicationRecordsMutation
      .mutateAsync({
        recordIds: prescription.recordIds,
        body: { status: "SUCCESS" },
      })
      .then((results) => {
        const fulfilledCount = results.filter((result) => result.status === "fulfilled").length;
        const rejectedCount = results.length - fulfilledCount;

        if (rejectedCount > 0) {
          Alert.alert(
            "복약 처리 일부 실패",
            `${results.length}건 중 ${fulfilledCount}건은 완료되었으나 ${rejectedCount}건에서 오류가 발생했습니다.`,
          );
        }
      })
      .catch(async (error) => {
        const message = await getApiErrorMessage(error, "복약 완료 처리 중 오류가 발생했습니다.");
        Alert.alert("복약 처리 실패", message);
      })
      .finally(() => setTakingPrescriptionId(null));
  };

  return {
    adherenceRate,
    adherenceSummaryText,
    scheduleRemainingCount,
    scheduleCards,
    recentPrescriptions,
    healthTipTitle: "건강 팁",
    healthTipDescription:
      "약은 충분한 물과 함께 복용하세요. 최소 200ml(컵 1잔) 이상의 물과 함께 드시면 효과가 더 좋아요.",
    isLoading: todayScheduleQuery.isLoading || prescriptionsQuery.isLoading,
    isError: todayScheduleQuery.isError || prescriptionsQuery.isError,
    takingPrescriptionId,
    markPrescriptionAsTaken,
    refetch,
  };
}
