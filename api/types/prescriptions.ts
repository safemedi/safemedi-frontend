export interface PrescriptionMedicationItem {
  readonly medicationId: number;
  readonly prescriptionDrugId?: number;
  readonly drugCode?: string;
  readonly atcCode: string;
  readonly drugName: string;
  readonly takeTimes: readonly string[];
  readonly mainIngredient: string;
  readonly hasWarning: boolean;
  readonly warningMessage?: string | null;
}

export interface PrescriptionListItem {
  readonly prescriptionId: number;
  readonly title: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly isDoctorApproved?: boolean;
  readonly hasAllergyConflict?: boolean;
  readonly createdAt?: string;
  readonly drugCount?: number;
  readonly medications: readonly PrescriptionMedicationItem[];
}

export interface PrescriptionsListResponse {
  readonly prescriptions: readonly PrescriptionListItem[];
  readonly isLast?: boolean;
}

export interface UpdatePrescriptionMedicationBody {
  readonly prescriptionDrugId: number;
  readonly takeTimes: readonly string[];
}

export interface UpdatePrescriptionRequest {
  readonly title?: string;
  readonly medications?: readonly UpdatePrescriptionMedicationBody[];
}

export interface UpdatePrescriptionResponse {
  readonly prescriptionId: number;
  readonly title: string;
  readonly message: string;
}

export interface DeletePrescriptionResponse {
  readonly message: string;
}
