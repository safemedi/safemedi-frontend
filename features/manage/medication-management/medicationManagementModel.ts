import type { PrescriptionListItem } from "@/api/types/prescriptions";
import type { MedicationTakeSlot } from "@/features/scan/prescription-scan-result/usePrescriptionScanResultViewModel";
import type { MedicationEditDraft, MedicationEditKey } from "./medicationEditModel";

export interface MedicationManagementMedicationItem {
  readonly id: string;
  readonly medicationId: number;
  readonly drugName: string;
  readonly takeTimesLabel: string;
  readonly mainIngredient: string;
  readonly hasWarning: boolean;
  readonly warningMessage: string | null;
}

export interface MedicationManagementPrescriptionGroup {
  readonly id: string;
  readonly prescriptionId: number;
  readonly title: string;
  readonly medicationCountLabel: string;
  readonly medications: readonly MedicationManagementMedicationItem[];
}

export interface MedicationManagementViewModel {
  readonly prescriptionGroups: readonly MedicationManagementPrescriptionGroup[];
  readonly isPrescriptionExpanded: (prescriptionId: number) => boolean;
  readonly editingPrescriptionId: number | null;
  readonly prescriptionTitleDraft: string;
  readonly editingMedicationKey: MedicationEditKey | null;
  readonly editDraft: MedicationEditDraft | null;
  readonly isMedicationEditing: (prescriptionId: number, medicationId: number) => boolean;
  readonly isPrescriptionTitleEditing: (prescriptionId: number) => boolean;
  readonly isPrescriptionTitleSaveEnabled: boolean;
  readonly isSaveEditEnabled: boolean;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly isMutating: boolean;
  readonly refetch: () => Promise<unknown>;
  readonly togglePrescriptionExpanded: (prescriptionId: number) => void;
  readonly startEditPrescriptionTitle: (prescriptionId: number) => void;
  readonly changePrescriptionTitleDraft: (title: string) => void;
  readonly cancelEditPrescriptionTitle: () => void;
  readonly savePrescriptionTitle: () => void;
  readonly startEditMedication: (prescriptionId: number, medicationId: number) => void;
  readonly cancelEditMedication: () => void;
  readonly toggleEditTakeSlot: (slot: MedicationTakeSlot) => void;
  readonly saveEditMedication: () => void;
  readonly handleDeletePrescription: (prescriptionId: number, title: string) => void;
}

export function formatMedicationTakeTimesLabel(takeTimes: readonly string[]): string {
  if (takeTimes.length === 0) {
    return "복용 시간 미설정";
  }
  return `${takeTimes.join(", ")} 복용`;
}

export function mapPrescriptionToManagementGroup(
  prescription: PrescriptionListItem,
): MedicationManagementPrescriptionGroup {
  return {
    id: String(prescription.prescriptionId),
    prescriptionId: prescription.prescriptionId,
    title: prescription.title,
    medicationCountLabel: `${prescription.medications.length}개`,
    medications: prescription.medications.map((medication) => ({
      id: String(medication.medicationId),
      medicationId: medication.medicationId,
      drugName: medication.drugName,
      takeTimesLabel: formatMedicationTakeTimesLabel(medication.takeTimes),
      mainIngredient: medication.mainIngredient,
      hasWarning: medication.hasWarning,
      warningMessage: medication.warningMessage ?? null,
    })),
  };
}

export function mapPrescriptionsToManagementGroups(
  prescriptions: readonly PrescriptionListItem[],
): readonly MedicationManagementPrescriptionGroup[] {
  return prescriptions.map(mapPrescriptionToManagementGroup);
}

export function createInitialExpandedPrescriptionIds(
  prescriptions: readonly PrescriptionListItem[],
): ReadonlySet<number> {
  return new Set(prescriptions.map((prescription) => prescription.prescriptionId));
}

export function isPrescriptionExpanded(
  collapsedIds: ReadonlySet<number>,
  prescriptionId: number,
): boolean {
  return !collapsedIds.has(prescriptionId);
}

export function toggleCollapsedPrescriptionId(
  collapsedIds: ReadonlySet<number>,
  prescriptionId: number,
): ReadonlySet<number> {
  const nextIds = new Set(collapsedIds);
  if (nextIds.has(prescriptionId)) {
    nextIds.delete(prescriptionId);
    return nextIds;
  }
  nextIds.add(prescriptionId);
  return nextIds;
}
