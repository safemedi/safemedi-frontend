import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { StyleSheet, View } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";

interface AdherenceSummaryCardProps {
  readonly adherenceRate: number;
  readonly adherenceSummaryText: string;
}

export function AdherenceSummaryCard({
  adherenceRate,
  adherenceSummaryText,
}: AdherenceSummaryCardProps) {
  const progressWidth = `${Math.min(100, Math.max(0, adherenceRate))}%` as const;

  return (
    <SurfaceCard style={styles.card}>
      <XStack items="center" justify="space-between">
        <XStack items="center" gap={10}>
          <View style={styles.iconWrap}>
            <FontAwesome6 name="arrow-trend-up" size={12} color={palette.white} />
          </View>
          <YStack gap={2}>
            <Text style={styles.title}>오늘의 복약 이행률</Text>
            <Text style={styles.subtitle}>{adherenceSummaryText}</Text>
          </YStack>
        </XStack>
        <Text style={styles.rate}>{adherenceRate}%</Text>
      </XStack>
      <View style={styles.track}>
        <View style={[styles.fill, { width: progressWidth }]} />
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.green,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.black,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: palette.icon,
  },
  rate: {
    fontSize: 34,
    lineHeight: 36,
    fontWeight: "700",
    color: palette.green_deep,
  },
  track: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: palette.overlay_blue_20,
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: palette.blue,
  },
});
