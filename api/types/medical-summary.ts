export interface MedicalSummaryResponse {
  readonly name: string | null;
  readonly birthDate: string | null;
  readonly gender: "MALE" | "FEMALE" | null;
  readonly height: number | null;
  readonly weight: number | null;
  readonly bloodType: string | null;
  readonly rhType: "PLUS" | "MINUS" | null;
  readonly diseases: readonly MedicalSummaryDisease[];
  readonly allergies: readonly MedicalSummaryAllergy[];
  readonly activeMedications: readonly MedicalSummaryPrescription[];
}

export interface MedicalSummaryDisease {
  readonly code: string;
  readonly name: string;
}

export interface MedicalSummaryAllergy {
  readonly type: string;
  readonly value: string;
  readonly name: string;
}

export interface MedicalSummaryPrescription {
  readonly prescriptionId: number;
  readonly prescriptionTitle: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly medications: readonly { readonly drugName: string }[];
}
