import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";

export function MedicationManagementTipCard() {
  return (
    <SurfaceCard style={styles.card}>
      <LinearGradient
        colors={[palette.notice_bg_start, palette.notice_bg_end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <XStack gap={10} items="flex-start">
          <Text style={styles.emoji}>💡</Text>
          <YStack gap={4} flex={1}>
            <Text style={styles.title}>복약 관리 팁</Text>
            <Text style={styles.description}>
              처방전 단위로 약물을 관리하세요. 처방이 변경되면 즉시 업데이트하는 것이 중요합니다.
            </Text>
          </YStack>
        </XStack>
      </LinearGradient>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderColor: palette.notice_border,
  },
  gradient: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  emoji: {
    fontSize: 21,
    lineHeight: 28,
  },
  title: {
    color: palette.notice_title,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  description: {
    color: palette.notice_description,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
  },
});
