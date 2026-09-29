export type MedicationHistoryCardTone = "safe" | "warning";

export interface MedicationHistoryWarningItem {
  readonly id: string;
  readonly message: string;
}

export interface MedicationHistoryMedicationItem {
  readonly id: string;
  readonly medicationName: string;
  readonly scheduledTimesLabel: string;
  readonly activeIngredients: readonly string[];
  readonly tone: MedicationHistoryCardTone;
  readonly warningItems: readonly MedicationHistoryWarningItem[];
}

export interface MedicationHistoryViewModel {
  readonly displayDate: string;
  readonly warningSummary: string | null;
  readonly medications: readonly MedicationHistoryMedicationItem[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly refetch: () => Promise<unknown>;
}
