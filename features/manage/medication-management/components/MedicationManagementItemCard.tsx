import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { palette } from "@/constants/design-tokens";
import type { MedicationTakeSlot } from "@/features/scan/prescription-scan-result/usePrescriptionScanResultViewModel";
import type { MedicationEditDraft } from "../medicationEditModel";
import type { MedicationManagementMedicationItem } from "../medicationManagementModel";
import { MedicationManagementInlineEditor } from "./MedicationManagementInlineEditor";

interface MedicationManagementItemCardProps {
  readonly medication: MedicationManagementMedicationItem;
  readonly isEditing: boolean;
  readonly editDraft: MedicationEditDraft | null;
  readonly isSaveEnabled: boolean;
  readonly isSaving: boolean;
  readonly onEdit: () => void;
  readonly onCancelEdit: () => void;
  readonly onSaveEdit: () => void;
  readonly onToggleTakeSlot: (slot: MedicationTakeSlot) => void;
}

export function MedicationManagementItemCard({
  medication,
  isEditing,
  editDraft,
  isSaveEnabled,
  isSaving,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onToggleTakeSlot,
}: MedicationManagementItemCardProps) {
  const cardStyle = medication.hasWarning ? styles.warningCard : styles.normalCard;
  const cardBackground = medication.hasWarning ? (
    <LinearGradient
      colors={[...palette.bg_allergy_card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={StyleSheet.absoluteFillObject}
    />
  ) : null;

  if (isEditing && editDraft) {
    return (
      <View style={[styles.card, styles.editingCard]}>
        <Text style={styles.editingTitle}>약물 수정</Text>
        <MedicationManagementInlineEditor
          draft={editDraft}
          isSaveEnabled={isSaveEnabled}
          isSaving={isSaving}
          onToggleTakeSlot={onToggleTakeSlot}
          onCancel={onCancelEdit}
          onSave={onSaveEdit}
        />
      </View>
    );
  }

  return (
    <View style={[styles.card, cardStyle]}>
      {cardBackground}

      <YStack gap={10}>
        <YStack gap={4}>
          <XStack items="center" gap={7} flexWrap="wrap">
            <Text style={styles.drugName}>{medication.drugName}</Text>
            {medication.hasWarning ? (
              <View style={styles.warningBadge}>
                <Text style={styles.warningBadgeText}>경고</Text>
              </View>
            ) : null}
          </XStack>

          <XStack items="center" gap={4}>
            <Ionicons name="time-outline" size={14} color={palette.icon} />
            <Text style={styles.takeTimes}>{medication.takeTimesLabel}</Text>
          </XStack>
        </YStack>

        <YStack gap={7}>
          <Text style={styles.ingredientLabel}>주성분</Text>
          <View style={styles.ingredientBadge}>
            <Text style={styles.ingredientBadgeText}>{medication.mainIngredient}</Text>
          </View>
        </YStack>

        <View style={styles.actionDivider} />
        <XStack gap={7}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${medication.drugName} 수정`}
            onPress={onEdit}
            style={({ pressed }) => [
              styles.actionButton,
              styles.editButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="create-outline" size={14} color={palette.green_deep} />
            <Text style={styles.editButtonText}>수정</Text>
          </Pressable>
        </XStack>

        {medication.hasWarning && medication.warningMessage ? (
          <>
            <View style={styles.warningDivider} />
            <XStack gap={7} items="flex-start">
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={14}
                color={palette.red_quick_text}
              />
              <YStack gap={4} flex={1}>
                <Text style={styles.warningTitle}>경고 사항</Text>
                <Text style={styles.warningMessage}>{medication.warningMessage}</Text>
              </YStack>
            </XStack>
          </>
        ) : null}
      </YStack>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 15,
    overflow: "hidden",
    backgroundColor: palette.white,
  },
  editingCard: {
    borderColor: palette.purple,
    backgroundColor: palette.white,
  },
  editingTitle: {
    color: palette.title_emphasis,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    marginBottom: 12,
  },
  normalCard: {
    borderColor: palette.light_green,
  },
  warningCard: {
    borderColor: palette.red_soft,
  },
  drugName: {
    color: palette.title_emphasis,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
  },
  warningBadge: {
    backgroundColor: palette.red_medium,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  warningBadgeText: {
    color: palette.white,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
  },
  takeTimes: {
    color: palette.icon,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
  },
  ingredientLabel: {
    color: palette.black,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  ingredientBadge: {
    alignSelf: "flex-start",
    backgroundColor: palette.surface_neutral,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ingredientBadgeText: {
    color: palette.black,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
  },
  actionDivider: {
    borderTopWidth: 1,
    borderTopColor: palette.dark_gray,
    marginTop: 2,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 7,
    backgroundColor: palette.gray,
  },
  editButton: {
    borderColor: palette.green_soft,
  },
  editButtonText: {
    color: palette.green_deep,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },
  warningDivider: {
    borderTopWidth: 1,
    borderTopColor: palette.red_soft,
    paddingTop: 12,
  },
  warningTitle: {
    color: palette.red_quick_text,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  warningMessage: {
    color: palette.red_quick_text,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
  },
  pressed: {
    opacity: 0.85,
  },
});
