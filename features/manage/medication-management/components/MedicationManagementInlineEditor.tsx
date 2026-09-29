import { Pressable, StyleSheet, View } from "react-native";
import { Text, YStack } from "tamagui";

import { palette } from "@/constants/design-tokens";
import {
  MEDICATION_TAKE_SLOT_OPTIONS,
  type MedicationTakeSlot,
} from "@/features/scan/prescription-scan-result/usePrescriptionScanResultViewModel";
import type { MedicationEditDraft } from "../medicationEditModel";

interface MedicationManagementInlineEditorProps {
  readonly draft: MedicationEditDraft;
  readonly isSaveEnabled: boolean;
  readonly isSaving: boolean;
  readonly onToggleTakeSlot: (slot: MedicationTakeSlot) => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
}

export function MedicationManagementInlineEditor({
  draft,
  isSaveEnabled,
  isSaving,
  onToggleTakeSlot,
  onCancel,
  onSave,
}: MedicationManagementInlineEditorProps) {
  return (
    <YStack gap={12}>
      <YStack gap={8}>
        <Text style={styles.label}>약물이름</Text>
        <View style={styles.readonlyField}>
          <Text style={styles.readonlyDrugName}>{draft.drugName}</Text>
          <Text style={styles.metaText}>약물 코드는 현재 API에서 수정할 수 없습니다.</Text>
        </View>
        <Text style={styles.verifiedText}>약물 코드: {draft.atcCode}</Text>
      </YStack>

      <YStack gap={8}>
        <Text style={styles.label}>복약 시간 선택</Text>
        <View style={styles.slotRow}>
          {MEDICATION_TAKE_SLOT_OPTIONS.map((option) => {
            const isSelected = draft.takeSlots.includes(option.slot);
            return (
              <Pressable
                key={option.slot}
                onPress={() => onToggleTakeSlot(option.slot)}
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
                  style={[styles.slotTimeRange, isSelected ? styles.slotTimeRangeSelected : null]}
                >
                  {option.timeRange}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {draft.takeSlots.length === 0 ? (
          <Text style={styles.requiredText}>최소 1개 이상의 복약 시간을 선택해주세요.</Text>
        ) : null}
      </YStack>

      <View style={styles.actionDivider} />
      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="수정 취소"
          onPress={onCancel}
          disabled={isSaving}
          style={({ pressed }) => [
            styles.actionButton,
            styles.cancelButton,
            pressed ? styles.pressed : null,
            isSaving ? styles.disabled : null,
          ]}
        >
          <Text style={styles.cancelButtonText}>취소</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="수정 저장"
          onPress={onSave}
          disabled={!isSaveEnabled || isSaving}
          style={({ pressed }) => [
            styles.actionButton,
            styles.saveButton,
            pressed ? styles.pressed : null,
            !isSaveEnabled || isSaving ? styles.disabled : null,
          ]}
        >
          <Text style={styles.saveButtonText}>{isSaving ? "저장 중..." : "저장"}</Text>
        </Pressable>
      </View>
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
  readonlyField: {
    backgroundColor: palette.gray,
    borderWidth: 1,
    borderColor: palette.surface_card_border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  readonlyDrugName: {
    color: palette.black,
    fontSize: 14,
    lineHeight: 20,
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
  actionDivider: {
    borderTopWidth: 1,
    borderTopColor: palette.dark_gray,
    marginTop: 2,
    paddingTop: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 7,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 9,
  },
  cancelButton: {
    borderColor: palette.dark_gray,
    backgroundColor: palette.gray,
  },
  saveButton: {
    borderColor: palette.green_soft,
    backgroundColor: palette.risk_safe_badge_bg,
  },
  cancelButtonText: {
    color: palette.black,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  saveButtonText: {
    color: palette.green_deep,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.45,
  },
});
