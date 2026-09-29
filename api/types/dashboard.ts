export type {
  DailyMedicationRecordsResponse,
  MedicationRecordItem,
  MedicationRecordStatus,
  MedicationRecordsQueryType,
  MedicationRecordsSummary,
  MedicationStatisticsDailyCompliance,
  MedicationStatisticsResponse,
  MonthlyMedicationRecordGroup,
  MonthlyMedicationRecordsResponse,
} from "./medications";

export type TodayMedicationScheduleStatus = "SUCCESS" | "NEED_TAKE" | "WAITING" | "MISSED" | "SKIP";

export interface TodayMedicationScheduleSummary {
  readonly completedCount: number;
  readonly totalCount: number;
  readonly completionRate: number;
}

export interface TodayMedicationScheduleItem {
  readonly takeTime: string;
  readonly status?: TodayMedicationScheduleStatus;
  readonly displayStatus?: TodayMedicationScheduleStatus;
  readonly prescriptionId: number;
  readonly prescriptionTitle: string;
  readonly drugCount: number;
  readonly drugNames?: readonly string[];
  readonly recordIds: readonly number[];
}

export interface TodayMedicationSchedulesResponse {
  readonly date: string;
  readonly summary: TodayMedicationScheduleSummary;
  readonly schedules: readonly TodayMedicationScheduleItem[];
}

export interface UpdateMedicationRecordRequest {
  readonly status: "SUCCESS" | "SKIP";
}

export interface UpdateMedicationRecordResponse {
  readonly recordId: number;
  readonly prescriptionId: number;
  readonly scheduledAt: string;
  readonly takenAt: string | null;
  readonly status: TodayMedicationScheduleStatus;
}
