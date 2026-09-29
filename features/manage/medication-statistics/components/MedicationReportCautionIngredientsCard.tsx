import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import type { MedicationReportCautionIngredientItem } from "../medicationReportStatistics";

interface MedicationReportCautionIngredientsCardProps {
  readonly items: readonly MedicationReportCautionIngredientItem[];
}

function resolveItemStyle(riskLevel: MedicationReportCautionIngredientItem["riskLevel"]) {
  if (riskLevel === "DANGER") {
    return {
      container: styles.dangerContainer,
      badge: styles.dangerBadge,
    };
  }

  return {
    container: styles.cautionContainer,
    badge: styles.cautionBadge,
  };
}

export function MedicationReportCautionIngredientsCard({
  items,
}: MedicationReportCautionIngredientsCardProps) {
  return (
    <SurfaceCard style={styles.card}>
      <XStack items="center" gap={8} mb={14}>
        <MaterialCommunityIcons
          name="alert-outline"
          size={18}
          color={palette.warning_interaction_message}
        />
        <Text style={styles.title}>주의 성분 섭취 통계</Text>
      </XStack>

      {items.length > 0 ? (
        <YStack gap={10}>
          {items.map((item) => {
            const itemStyle = resolveItemStyle(item.riskLevel);

            return (
              <View key={item.id} style={[styles.itemContainer, itemStyle.container]}>
                <XStack items="center" justify="space-between" gap={12}>
                  <YStack gap={2} flex={1}>
                    <Text style={styles.ingredientName}>{item.name}</Text>
                    <Text style={styles.intakeCount}>이번 달 {item.monthlyIntakeCount}회 섭취</Text>
                  </YStack>
                  <View style={[styles.badge, itemStyle.badge]}>
                    <Text style={styles.badgeText}>{item.riskLabel}</Text>
                  </View>
                </XStack>
              </View>
            );
          })}
        </YStack>
      ) : (
        <Text style={styles.emptyText}>이번 달 주의가 필요한 성분이 없습니다.</Text>
      )}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 17,
  },
  title: {
    color: palette.title_emphasis,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
  itemContainer: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  cautionContainer: {
    backgroundColor: palette.warning_interaction_bg,
    borderColor: palette.warning_interaction_border,
  },
  dangerContainer: {
    backgroundColor: palette.warning_allergy_bg,
    borderColor: palette.red_soft,
  },
  ingredientName: {
    color: palette.title_emphasis,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
  },
  intakeCount: {
    color: palette.icon,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cautionBadge: {
    backgroundColor: palette.risk_caution_start,
  },
  dangerBadge: {
    backgroundColor: palette.red_medium,
  },
  badgeText: {
    color: palette.white,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
  },
  emptyText: {
    color: palette.icon,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    fontWeight: "500",
    paddingVertical: 12,
  },
});
