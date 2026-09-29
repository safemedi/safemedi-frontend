import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";

interface MedicationReportSummaryCardProps {
  readonly complianceRate: number;
  readonly periodRangeLabel: string;
  readonly perfectDaysCount: number;
  readonly attentionDaysCount: number;
}

export function MedicationReportSummaryCard({
  complianceRate,
  periodRangeLabel,
  perfectDaysCount,
  attentionDaysCount,
}: MedicationReportSummaryCardProps) {
  return (
    <SurfaceCard style={styles.card}>
      <XStack items="center" justify="space-between" gap={12}>
        <XStack items="center" gap={10} flex={1}>
          <LinearGradient
            colors={[palette.green, palette.opal]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <MaterialCommunityIcons name="trending-up" size={18} color={palette.white} />
          </LinearGradient>
          <YStack gap={2} flex={1}>
            <Text style={styles.label}>이번 달 평균 이행률</Text>
            <Text style={styles.period}>{periodRangeLabel}</Text>
          </YStack>
        </XStack>
        <Text style={styles.rate}>{complianceRate}%</Text>
      </XStack>

      <XStack gap={7} mt={14}>
        <View style={styles.perfectBadge}>
          <MaterialCommunityIcons
            name="check-circle"
            size={11}
            color={palette.risk_safe_badge_text}
          />
          <Text style={styles.perfectBadgeText}>완벽한 날 {perfectDaysCount}일</Text>
        </View>
        <View style={styles.attentionBadge}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={11}
            color={palette.warning_interaction_message}
          />
          <Text style={styles.attentionBadgeText}>주의 필요 {attentionDaysCount}일</Text>
        </View>
      </XStack>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 17,
  },
  iconCircle: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: palette.title_emphasis,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
  period: {
    color: palette.icon,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
  },
  rate: {
    color: palette.green_deep,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
  },
  perfectBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: palette.risk_safe_badge_bg,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  perfectBadgeText: {
    color: palette.risk_safe_badge_text,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
  },
  attentionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: palette.risk_caution_badge_bg,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  attentionBadgeText: {
    color: palette.warning_interaction_message,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
  },
});
