import type {
  PrescriptionListItem,
  UpdatePrescriptionMedicationBody,
} from "@/api/types/prescriptions";
import {
  MEDICATION_TAKE_SLOT_OPTIONS,
  type MedicationTakeSlot,
} from "@/features/scan/prescription-scan-result/usePrescriptionScanResultViewModel";

export interface MedicationEditKey {
  readonly prescriptionId: number;
  readonly medicationId: number;
}

export interface MedicationEditDraft {
  readonly drugName: string;
  readonly drugCode: string;
  readonly atcCode: string;
  readonly takeSlots: readonly MedicationTakeSlot[];
  readonly originalTakeTimes: readonly string[];
  readonly hasChangedTakeSlots: boolean;
}

export interface MedicationEditValidationResult {
  readonly isValid: boolean;
  readonly message: string | null;
}

export function createMedicationEditKey(
  prescriptionId: number,
  medicationId: number,
): MedicationEditKey {
  return { prescriptionId, medicationId };
}

export function isSameMedicationEditKey(
  left: MedicationEditKey | null,
  right: MedicationEditKey | null,
): boolean {
  if (!left || !right) {
    return false;
  }
  return left.prescriptionId === right.prescriptionId && left.medicationId === right.medicationId;
}

export function isMedicationEditing(
  editingKey: MedicationEditKey | null,
  prescriptionId: number,
  medicationId: number,
): boolean {
  return isSameMedicationEditKey(editingKey, createMedicationEditKey(prescriptionId, medicationId));
}

export function createMedicationEditDraft(
  prescription: PrescriptionListItem,
  medicationId: number,
): MedicationEditDraft | null {
  const medication = prescription.medications.find((item) => item.medicationId === medicationId);
  if (!medication) {
    return null;
  }

  return {
    drugName: medication.drugName,
    drugCode: medication.drugCode ?? "",
    atcCode: medication.atcCode,
    takeSlots: convertTakeTimesToTakeSlots(medication.takeTimes),
    originalTakeTimes: medication.takeTimes,
    hasChangedTakeSlots: false,
  };
}

export function convertTakeSlotsToTimes(takeSlots: readonly MedicationTakeSlot[]): string[] {
  const selected = new Set(takeSlots);
  return MEDICATION_TAKE_SLOT_OPTIONS.filter((option) => selected.has(option.slot)).map(
    (option) => option.defaultTime,
  );
}

export function convertTakeTimesToTakeSlots(takeTimes: readonly string[]): MedicationTakeSlot[] {
  const slots = new Set<MedicationTakeSlot>();

  takeTimes.forEach((takeTime) => {
    const matchedOption = MEDICATION_TAKE_SLOT_OPTIONS.find(
      (option) => option.defaultTime === takeTime,
    );
    if (matchedOption) {
      slots.add(matchedOption.slot);
      return;
    }

    const hour = Number.parseInt(takeTime.split(":")[0] ?? "0", 10);
    if (hour < 11) {
      slots.add("MORNING");
      return;
    }
    if (hour < 16) {
      slots.add("LUNCH");
      return;
    }
    slots.add("DINNER");
  });

  return MEDICATION_TAKE_SLOT_OPTIONS.map((option) => option.slot).filter((slot) =>
    slots.has(slot),
  );
}

export function toggleMedicationEditTakeSlot(
  draft: MedicationEditDraft,
  slot: MedicationTakeSlot,
): MedicationEditDraft {
  const hasSlot = draft.takeSlots.includes(slot);
  const nextSlots = hasSlot
    ? draft.takeSlots.filter((item) => item !== slot)
    : [...draft.takeSlots, slot];

  return {
    ...draft,
    takeSlots: nextSlots,
    hasChangedTakeSlots: true,
  };
}

export function validateMedicationEditDraft(
  draft: MedicationEditDraft,
): MedicationEditValidationResult {
  if (draft.drugName.trim().length === 0) {
    return { isValid: false, message: "약물명을 입력해주세요." };
  }
  if (draft.atcCode.trim().length === 0) {
    return { isValid: false, message: "약물 코드가 없는 약물은 수정할 수 없습니다." };
  }
  if (draft.takeSlots.length === 0) {
    return { isValid: false, message: "복약 시간을 최소 1개 이상 선택해주세요." };
  }
  return { isValid: true, message: null };
}

export function isMedicationEditDraftSavable(draft: MedicationEditDraft | null): boolean {
  if (!draft) {
    return false;
  }
  return validateMedicationEditDraft(draft).isValid;
}

export function buildUpdatedMedicationsAfterEdit(
  prescription: PrescriptionListItem,
  medicationId: number,
  draft: MedicationEditDraft,
): readonly UpdatePrescriptionMedicationBody[] {
  const takeTimes = draft.hasChangedTakeSlots
    ? convertTakeSlotsToTimes(draft.takeSlots)
    : [...draft.originalTakeTimes];

  return prescription.medications.map((medication) => {
    const prescriptionDrugId = medication.prescriptionDrugId ?? medication.medicationId;
    if (medication.medicationId !== medicationId) {
      return {
        prescriptionDrugId,
        takeTimes: medication.takeTimes,
      };
    }

    return {
      prescriptionDrugId,
      takeTimes,
    };
  });
}
