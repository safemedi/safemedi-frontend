import type {
  MedicationRecordUpdateStatus,
  TodayMedicationScheduleItem,
  TodayMedicationScheduleStatus,
  TodayMedicationSchedulesResponse,
} from "@/api/types/dashboard";

interface MedicationRecordStatusUpdate {
  readonly status: MedicationRecordUpdateStatus;
}

function getScheduleStatus(schedule: TodayMedicationScheduleItem): TodayMedicationScheduleStatus {
  return schedule.displayStatus ?? schedule.status ?? "WAITING";
}

function isCompletedStatus(status: TodayMedicationScheduleStatus): boolean {
  return status === "SUCCESS" || status === "SKIP";
}

function resolveNextStatus(body: MedicationRecordStatusUpdate): TodayMedicationScheduleStatus {
  return body.status === "PENDING" ? "WAITING" : body.status;
}

function buildUpdatedSummary(
  summary: TodayMedicationSchedulesResponse["summary"],
  completedDelta: number,
): TodayMedicationSchedulesResponse["summary"] {
  const completedCount = Math.max(
    0,
    Math.min(summary.totalCount, summary.completedCount + completedDelta),
  );

  return {
    ...summary,
    completedCount,
    completionRate: summary.totalCount === 0 ? 0 : (completedCount / summary.totalCount) * 100,
  };
}

export function applyOptimisticMedicationRecordUpdate(
  data: TodayMedicationSchedulesResponse,
  recordId: number,
  body: MedicationRecordStatusUpdate,
): TodayMedicationSchedulesResponse {
  const nextStatus = resolveNextStatus(body);
  let completedDelta = 0;

  const schedules = data.schedules.map((schedule) => {
    if (!schedule.recordIds.includes(recordId)) {
      return schedule;
    }

    const currentStatus = getScheduleStatus(schedule);
    const wasCompleted = isCompletedStatus(currentStatus);
    const willBeCompleted = isCompletedStatus(nextStatus);

    if (!wasCompleted && willBeCompleted) {
      completedDelta += 1;
    } else if (wasCompleted && !willBeCompleted) {
      completedDelta -= 1;
    }

    return {
      ...schedule,
      displayStatus: nextStatus,
      status: nextStatus,
    };
  });

  return {
    ...data,
    schedules,
    summary: buildUpdatedSummary(data.summary, completedDelta),
  };
}

export function applyOptimisticMedicationRecordsUpdate(
  data: TodayMedicationSchedulesResponse,
  recordIds: readonly number[],
  body: MedicationRecordStatusUpdate,
): TodayMedicationSchedulesResponse {
  return recordIds.reduce(
    (currentData, recordId) => applyOptimisticMedicationRecordUpdate(currentData, recordId, body),
    data,
  );
}

/** 실패한 요청의 일정만 복구해 다른 요청의 완료 상태를 보존한다. */
export function rollbackMedicationRecordsUpdate(
  current: TodayMedicationSchedulesResponse,
  previous: TodayMedicationSchedulesResponse,
  recordIds: readonly number[],
): TodayMedicationSchedulesResponse {
  if (current.date !== previous.date) return current;
  let completedDelta = 0;
  const schedules = current.schedules.map((schedule) => {
    if (!schedule.recordIds.some((id) => recordIds.includes(id))) return schedule;
    const original = previous.schedules.find(
      (item) =>
        item.prescriptionId === schedule.prescriptionId &&
        item.takeTime === schedule.takeTime &&
        item.recordIds.length === schedule.recordIds.length &&
        item.recordIds.every((id) => schedule.recordIds.includes(id)),
    );
    if (!original) return schedule;
    completedDelta +=
      Number(isCompletedStatus(getScheduleStatus(original))) -
      Number(isCompletedStatus(getScheduleStatus(schedule)));
    return { ...schedule, status: original.status, displayStatus: original.displayStatus };
  });
  return { ...current, schedules, summary: buildUpdatedSummary(current.summary, completedDelta) };
}
