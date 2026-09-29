import type {
  TodayMedicationScheduleItem,
  TodayMedicationScheduleStatus,
  TodayMedicationSchedulesResponse,
  UpdateMedicationRecordRequest,
} from "@/api/types/dashboard";

function getScheduleStatus(schedule: TodayMedicationScheduleItem): TodayMedicationScheduleStatus {
  return schedule.displayStatus ?? schedule.status ?? "WAITING";
}

function isCompletedStatus(status: TodayMedicationScheduleStatus): boolean {
  return status === "SUCCESS" || status === "SKIP";
}

function resolveNextStatus(body: UpdateMedicationRecordRequest): TodayMedicationScheduleStatus {
  return body.status;
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
  body: UpdateMedicationRecordRequest,
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
  body: UpdateMedicationRecordRequest,
): TodayMedicationSchedulesResponse {
  return recordIds.reduce(
    (currentData, recordId) => applyOptimisticMedicationRecordUpdate(currentData, recordId, body),
    data,
  );
}
