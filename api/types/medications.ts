export type MedicationRecordStatus = "SUCCESS" | "PENDING";

export type MedicationRecordsQueryType = "DAILY" | "WEEK" | "MONTH";

export interface MedicationRecordsSummary {
  readonly totalCount: number;
  readonly takenCount: number;
  readonly fraction: string;
  readonly complianceRate: number;
}

export interface MedicationRecordItem {
  readonly recordId: number;
  readonly prescriptionTitle: string;
  readonly medicationNames: readonly string[];
  readonly scheduledTime: string;
  readonly takenTime: string | null;
  readonly status: MedicationRecordStatus;
  readonly isGoldenTime?: boolean;
  readonly warningMessages?: readonly string[];
}

export interface DailyMedicationRecordsResponse {
  readonly date: string;
  readonly currentTime?: string;
  readonly familyId?: number;
  readonly relation?: string;
  readonly summary: MedicationRecordsSummary;
  readonly records: readonly MedicationRecordItem[];
}

export interface MonthlyMedicationRecordGroup {
  readonly date: string;
  readonly items: readonly MedicationRecordItem[];
}

export interface MonthlyMedicationRecordsResponse {
  readonly period: string;
  readonly summary: MedicationRecordsSummary;
  readonly records: readonly MonthlyMedicationRecordGroup[];
}

export interface MedicationStatisticsDailyCompliance {
  readonly date: string;
  readonly takenCount: number;
  readonly totalCount: number;
  readonly fraction: string;
}

export interface MedicationStatisticsResponse {
  readonly startDate: string;
  readonly endDate: string;
  readonly totalScheduled: number;
  readonly totalTaken: number;
  readonly totalComplianceRate: number;
  readonly dailyCompliance: readonly MedicationStatisticsDailyCompliance[];
}
