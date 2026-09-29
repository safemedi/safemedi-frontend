import { useMemo } from "react";
import { type Control, useWatch } from "react-hook-form";
import { StyleSheet } from "react-native";
import type { DrugSearchItem } from "@/api/types";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import { isConfirmedAtcCode } from "@/features/scan/prescription-scan/ocr-parser";
import type {
  MedicationTakeSlot,
  PrescriptionScanResultFormValues,
} from "../usePrescriptionScanResultViewModel";
import { MedicationDrugSearchField } from "./MedicationDrugSearchField";
import { MedicationEditorHeader } from "./MedicationEditorHeader";
import { MedicationEditorSummary } from "./MedicationEditorSummary";
import { MedicationTakeSlotSelector } from "./MedicationTakeSlotSelector";

interface MedicationEditorCardProps {
  readonly index: number;
  readonly control: Control<PrescriptionScanResultFormValues>;
  readonly isExpanded: boolean;
  readonly onPressRemove: () => void;
  readonly onPressEdit: () => void;
  readonly onPressComplete: () => void;
  readonly onChangeMedicationName: (index: number, drugName: string) => void;
  readonly onSelectMedicationDrug: (index: number, item: DrugSearchItem) => void;
  readonly onToggleMedicationTakeSlot: (index: number, slot: MedicationTakeSlot) => void;
}

export function MedicationEditorCard({
  index,
  control,
  isExpanded,
  onPressRemove,
  onPressEdit,
  onPressComplete,
  onChangeMedicationName,
  onSelectMedicationDrug,
  onToggleMedicationTakeSlot,
}: MedicationEditorCardProps) {
  const medicationName = useWatch({
    control,
    name: `medications.${index}.drugName`,
    defaultValue: "",
  });
  const atcCode = useWatch({
    control,
    name: `medications.${index}.atcCode`,
    defaultValue: "",
  });
  const selectedTakeSlots = useWatch({
    control,
    name: `medications.${index}.takeSlots`,
    defaultValue: [],
  });

  const isCompleteEnabled = useMemo(() => {
    const hasMedicationName = medicationName.trim().length > 0;
    const hasMedicationCode = isConfirmedAtcCode(atcCode);
    const hasTakeSlot = selectedTakeSlots.length > 0;
    return hasMedicationName && hasMedicationCode && hasTakeSlot;
  }, [atcCode, medicationName, selectedTakeSlots]);

  return (
    <SurfaceCard style={styles.card}>
      <MedicationEditorHeader
        index={index}
        isExpanded={isExpanded}
        isCompleteEnabled={isCompleteEnabled}
        onPressEdit={onPressEdit}
        onPressComplete={onPressComplete}
        onPressRemove={onPressRemove}
      />

      {!isExpanded ? (
        <MedicationEditorSummary
          medicationName={medicationName}
          atcCode={atcCode}
          selectedTakeSlots={selectedTakeSlots}
        />
      ) : null}

      {isExpanded ? (
        <>
          <MedicationDrugSearchField
            index={index}
            control={control}
            onChangeMedicationName={onChangeMedicationName}
            onSelectMedicationDrug={onSelectMedicationDrug}
          />
          <MedicationTakeSlotSelector
            index={index}
            control={control}
            onToggleMedicationTakeSlot={onToggleMedicationTakeSlot}
          />
        </>
      ) : null}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderColor: palette.purple,
    gap: 12,
  },
});
