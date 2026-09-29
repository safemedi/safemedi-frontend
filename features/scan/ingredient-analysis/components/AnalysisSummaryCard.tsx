import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";
import { Text, YStack } from "tamagui";
import { GradientCard } from "@/components/ui/GradientCard";
import { palette } from "@/constants/design-tokens";

interface AnalysisSummaryCardProps {
  readonly analyzedMedicationCount: number;
  readonly dangerCount: number;
  readonly cautionCount: number;
  readonly safeCount: number;
}

interface SummaryBadgeProps {
  readonly label: string;
  readonly backgroundColor: string;
  readonly textColor: string;
}

function SummaryBadge({ label, backgroundColor, textColor }: SummaryBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

export function AnalysisSummaryCard({
  analyzedMedicationCount,
  dangerCount,
  cautionCount,
  safeCount,
}: AnalysisSummaryCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <GradientCard gradientColors={[palette.green, palette.opal]} style={styles.iconCircle}>
          <Ionicons name="shield-checkmark-outline" size={18} color={palette.white} />
        </GradientCard>
        <YStack gap={2}>
          <Text style={styles.title}>종합 안전도 분석</Text>
          <Text style={styles.description}>{analyzedMedicationCount}개 약물 분석 완료</Text>
        </YStack>
      </View>
      <View style={styles.badgeRow}>
        <SummaryBadge
          label={`위험 ${dangerCount}`}
          backgroundColor={palette.risk_danger_badge_bg}
          textColor={palette.red_quick_text}
        />
        <SummaryBadge
          label={`주의 ${cautionCount}`}
          backgroundColor={palette.risk_caution_badge_bg}
          textColor={palette.warning_interaction_message}
        />
        <SummaryBadge
          label={`안전 ${safeCount}`}
          backgroundColor={palette.risk_safe_badge_bg}
          textColor={palette.risk_safe_badge_text}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
    backgroundColor: palette.overlay_white_90,
    borderWidth: 1,
    borderColor: palette.surface_card_border,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: palette.title_emphasis,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  description: {
    color: palette.icon,
    fontSize: 12,
    lineHeight: 17,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    flex: 1,
    minHeight: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
  },
});
