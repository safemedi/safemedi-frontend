import { StyleSheet, View } from "react-native";
import { Text, YStack } from "tamagui";
import { palette } from "@/constants/design-tokens";
import { isConfirmedAtcCode } from "@/features/scan/prescription-scan/ocr-parser";
import {
  MEDICATION_TAKE_SLOT_OPTIONS,
  type MedicationTakeSlot,
} from "../usePrescriptionScanResultViewModel";

interface MedicationEditorSummaryProps {
  readonly medicationName: string;
  readonly atcCode: string;
  readonly selectedTakeSlots: readonly MedicationTakeSlot[];
}

export function MedicationEditorSummary({
  medicationName,
  atcCode,
  selectedTakeSlots,
}: MedicationEditorSummaryProps) {
  const takeSlotSummary =
    selectedTakeSlots.length === 0
      ? "미선택"
      : MEDICATION_TAKE_SLOT_OPTIONS.filter((option) => selectedTakeSlots.includes(option.slot))
          .map((option) => option.label)
          .join(", ");
  const isAtcCodeConfirmed = isConfirmedAtcCode(atcCode);

  return (
    <YStack gap={6}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>약물이름</Text>
        <Text style={styles.summaryValue}>{medicationName || "미입력"}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>복약 시간</Text>
        <Text style={styles.summaryValue}>{takeSlotSummary}</Text>
      </View>
      <Text
        style={[styles.metaText, isAtcCodeConfirmed ? styles.verifiedText : styles.unverifiedText]}
      >
        {isAtcCodeConfirmed ? `약물 코드: ${atcCode}` : "검색 결과에서 약물을 선택해야 등록됩니다."}
      </Text>
    </YStack>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  summaryLabel: {
    color: palette.icon,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
  summaryValue: {
    color: palette.black,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  metaText: {
    color: palette.icon,
    fontSize: 12,
    lineHeight: 16,
  },
  verifiedText: {
    color: palette.green,
  },
  unverifiedText: {
    color: palette.red_medium,
  },
});
