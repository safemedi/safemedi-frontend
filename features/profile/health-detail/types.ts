export interface PatientInfo {
  readonly name: string;
  readonly birthDate: string;
  readonly gender: string;
  readonly height: string;
  readonly weight: string;
  readonly bloodType: string;
}

export interface ClinicalAlertItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly badgeLabel: string;
}

export interface ClinicalAlertSection {
  readonly title: string;
  readonly subtitle: string;
  readonly items: readonly ClinicalAlertItem[];
  readonly tone: "danger" | "info";
}
