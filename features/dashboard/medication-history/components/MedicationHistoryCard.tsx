import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";
import { Text, YStack } from "tamagui";
import { PillButton } from "@/components/ui/PillButton";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import type { MedicationHistoryMedicationItem } from "../types";

const SAFE_LABEL = "안전";
const WARNING_LABEL = "경고";

interface MedicationHistoryCardProps {
  readonly medication: MedicationHistoryMedicationItem;
  readonly onPressApprove: () => void;
}

export function MedicationHistoryCard({ medication, onPressApprove }: MedicationHistoryCardProps) {
  const isWarningTone = medication.tone === "warning";
  const cardStyle = isWarningTone ? [styles.card, styles.warningCard] : styles.card;

  return (
    <SurfaceCard style={cardStyle}>
      <View style={styles.headerRow}>
        <YStack gap={4} style={styles.titleWrap}>
          <Text style={styles.medicationName}>{medication.medicationName}</Text>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={14} color={palette.icon} />
            <Text style={styles.timeText}>{medication.scheduledTimesLabel}</Text>
          </View>
        </YStack>
        <View style={[styles.statusBadge, isWarningTone ? styles.warningBadge : styles.safeBadge]}>
          <Text style={styles.statusText}>{isWarningTone ? WARNING_LABEL : SAFE_LABEL}</Text>
        </View>
      </View>

      <YStack gap={8} style={styles.ingredientsSection}>
        <Text style={styles.sectionLabel}>주성분</Text>
        <View style={styles.ingredientsWrap}>
          {medication.activeIngredients.map((ingredient) => (
            <View key={`${medication.id}-${ingredient}`} style={styles.ingredientChip}>
              <Text style={styles.ingredientText}>{ingredient}</Text>
            </View>
          ))}
        </View>
      </YStack>

      {isWarningTone && medication.warningItems.length > 0 ? (
        <View style={styles.warningSection}>
          <View style={styles.warningTitleRow}>
            <Ionicons name="warning-outline" size={14} color={palette.red_quick_text} />
            <Text style={styles.warningTitle}>경고 사항</Text>
          </View>
          <YStack gap={4}>
            {medication.warningItems.map((warningItem) => (
              <View key={warningItem.id} style={styles.warningItemRow}>
                <View style={styles.warningDot} />
                <Text style={styles.warningItemText}>{warningItem.message}</Text>
              </View>
            ))}
          </YStack>
          <PillButton
            variant="outline"
            onPress={onPressApprove}
            borderColor={palette.red_outline}
            backgroundColor={palette.surface_card}
            leftElement={
              <Ionicons name="warning-outline" size={16} color={palette.red_quick_text} />
            }
            accessibilityLabel="의사 상담 후 승인 버튼"
          >
            <Text style={styles.approveButtonText}>의사 상담 후 승인</Text>
          </PillButton>
          <Text style={styles.warningFootnote}>
            * 의사 상담 후 복용이 가능하다면 위 버튼을 눌러주세요
          </Text>
        </View>
      ) : null}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 16,
  },
  warningCard: {
    borderColor: palette.red_soft,
    backgroundColor: palette.bg_allergy_card[0],
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  titleWrap: {
    flex: 1,
  },
  medicationName: {
    color: palette.black,
    fontSize: 16,
    lineHeight: 25,
    fontWeight: "700",
    letterSpacing: -0.25,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    color: palette.icon,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  safeBadge: {
    backgroundColor: palette.green,
  },
  warningBadge: {
    backgroundColor: palette.red_medium,
  },
  statusText: {
    color: palette.white,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
  },
  ingredientsSection: {
    gap: 6,
  },
  sectionLabel: {
    color: palette.black,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  ingredientsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  ingredientChip: {
    backgroundColor: palette.surface_neutral,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ingredientText: {
    color: palette.black,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "500",
  },
  warningSection: {
    borderTopWidth: 1,
    borderTopColor: palette.red_soft,
    paddingTop: 14,
    gap: 10,
  },
  warningTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  warningTitle: {
    color: palette.red_quick_text,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  warningItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  warningDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.red_medium,
  },
  warningItemText: {
    flex: 1,
    color: palette.red_quick_text,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },
  approveButtonText: {
    color: palette.red_quick_text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  warningFootnote: {
    color: palette.red_strong,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "500",
  },
});
