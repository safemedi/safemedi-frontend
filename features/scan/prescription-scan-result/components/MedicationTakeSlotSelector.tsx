import { type Control, Controller } from "react-hook-form";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, YStack } from "tamagui";
import { palette } from "@/constants/design-tokens";
import {
  MEDICATION_TAKE_SLOT_OPTIONS,
  type MedicationTakeSlot,
  type PrescriptionScanResultFormValues,
} from "../usePrescriptionScanResultViewModel";

interface MedicationTakeSlotSelectorProps {
  readonly index: number;
  readonly control: Control<PrescriptionScanResultFormValues>;
  readonly onToggleMedicationTakeSlot: (index: number, slot: MedicationTakeSlot) => void;
}

export function MedicationTakeSlotSelector({
  index,
  control,
  onToggleMedicationTakeSlot,
}: MedicationTakeSlotSelectorProps) {
  return (
    <YStack gap={8}>
      <Text style={styles.label}>복약 시간 선택</Text>
      <Controller
        control={control}
        name={`medications.${index}.takeSlots`}
        render={({ field: { value } }) => (
          <>
            <View style={styles.slotRow}>
              {MEDICATION_TAKE_SLOT_OPTIONS.map((option) => {
                const isSelected = value.includes(option.slot);
                return (
                  <Pressable
                    key={option.slot}
                    onPress={() => onToggleMedicationTakeSlot(index, option.slot)}
                    style={({ pressed }) => [
                      styles.slotButton,
                      isSelected ? styles.slotButtonSelected : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={[styles.slotLabel, isSelected ? styles.slotLabelSelected : null]}>
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.slotTimeRange,
                        isSelected ? styles.slotTimeRangeSelected : null,
                      ]}
                    >
                      {option.timeRange}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {value.length === 0 ? (
              <Text style={styles.requiredText}>최소 1개 이상의 복약 시간을 선택해주세요.</Text>
            ) : null}
          </>
        )}
      />
    </YStack>
  );
}

const styles = StyleSheet.create({
  label: {
    color: palette.black,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  slotRow: {
    flexDirection: "row",
    gap: 8,
  },
  slotButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.border_muted,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    backgroundColor: palette.surface_subtle,
  },
  slotButtonSelected: {
    borderColor: palette.purple,
    backgroundColor: palette.gray,
  },
  slotLabel: {
    color: palette.black,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  slotLabelSelected: {
    color: palette.purple,
  },
  slotTimeRange: {
    color: palette.icon,
    fontSize: 10,
    lineHeight: 14,
  },
  slotTimeRangeSelected: {
    color: palette.purple,
  },
  requiredText: {
    color: palette.red_medium,
    fontSize: 11,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.8,
  },
});
