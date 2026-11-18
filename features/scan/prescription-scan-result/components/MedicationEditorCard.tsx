import { useMemo } from "react";
import { type Control, useWatch } from "react-hook-form";
import { StyleSheet } from "react-native";
import { Text } from "tamagui";
import type { DrugSearchItem } from "@/api/types";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import { isConfirmedAtcCode } from "@/utils/prescription";
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

  const dailyDoseCount = useWatch({ control, name: `medications.${index}.dailyDoseCount` });
  const instructions = useWatch({ control, name: `medications.${index}.instructions` });

  const additionalTakeTimes = useWatch({
    control,
    name: `medications.${index}.additionalTakeTimes`,
  });
  const isCompleteEnabled = useMemo(() => {
    const hasMedicationName = medicationName.trim().length > 0;
    const hasMedicationCode = isConfirmedAtcCode(atcCode);
    const hasTakeSlot = selectedTakeSlots.length > 0 || !!additionalTakeTimes?.trim();
    return hasMedicationName && hasMedicationCode && hasTakeSlot;
  }, [atcCode, medicationName, selectedTakeSlots, additionalTakeTimes]);

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

      {dailyDoseCount || instructions ? (
        <Text style={{ color: palette.icon, fontSize: 12 }}>
          {dailyDoseCount ? `사진에서 읽은 횟수: 하루 ${dailyDoseCount}회. ` : ""}
          {instructions ?? ""} 복용 시간을 확인해 주세요.
        </Text>
      ) : null}
      {!isExpanded ? (
        <MedicationEditorSummary
          medicationName={medicationName}
          atcCode={atcCode}
          selectedTakeSlots={selectedTakeSlots}
          additionalTakeTimes={additionalTakeTimes}
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
