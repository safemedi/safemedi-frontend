export interface ScanMedicationItem {
  readonly atcCode: string;
  readonly drugName: string;
  readonly drugCode?: string;
  readonly dailyDoseCount?: number;
  readonly instructions?: string;
}

export interface ScanPrescriptionDraft {
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly medications: readonly ScanMedicationItem[];
  readonly isDateRangeConfident?: boolean;
}
