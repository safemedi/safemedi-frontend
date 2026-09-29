import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import type { MedicationReportWeeklyComplianceItem } from "../medicationReportStatistics";

interface MedicationReportWeeklyComplianceCardProps {
  readonly items: readonly MedicationReportWeeklyComplianceItem[];
}

function resolveBarColor(tone: MedicationReportWeeklyComplianceItem["tone"]): string {
  return tone === "success" ? palette.green : palette.risk_caution_start;
}

export function MedicationReportWeeklyComplianceCard({
  items,
}: MedicationReportWeeklyComplianceCardProps) {
  return (
    <SurfaceCard style={styles.card}>
      <XStack items="center" gap={8} mb={14}>
        <MaterialCommunityIcons name="chart-bar" size={18} color={palette.purple} />
        <Text style={styles.title}>주간 복약 이행률</Text>
      </XStack>

      <YStack gap={10}>
        {items.map((item) => (
          <YStack key={item.dayLabel} gap={4}>
            <XStack items="center" justify="space-between">
              <Text style={styles.dayLabel}>{item.dayLabel}</Text>
              <Text style={styles.rateLabel}>
                {item.rate === null ? "예정" : `${item.fraction} (${item.rate}%)`}
              </Text>
            </XStack>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${item.rate ?? 0}%`,
                    backgroundColor:
                      item.tone === "future" ? palette.surface_neutral : resolveBarColor(item.tone),
                  },
                ]}
              />
            </View>
          </YStack>
        ))}
      </YStack>
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
  dayLabel: {
    color: palette.icon,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
  },
  rateLabel: {
    color: palette.title_emphasis,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  track: {
    height: 10,
    borderRadius: 999,
    backgroundColor: palette.surface_neutral,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
});
