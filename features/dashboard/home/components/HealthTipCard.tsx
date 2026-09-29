import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { palette } from "@/constants/design-tokens";

interface HealthTipCardProps {
  readonly title: string;
  readonly description: string;
}

export function HealthTipCard({ title, description }: HealthTipCardProps) {
  return (
    <LinearGradient
      colors={[palette.notice_bg_start, palette.notice_bg_end]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <XStack gap={10} items="flex-start">
        <Text style={styles.emoji}>💡</Text>
        <YStack gap={4} flex={1}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </YStack>
      </XStack>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: palette.notice_border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  emoji: {
    fontSize: 20,
    lineHeight: 26,
  },
  title: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    color: palette.notice_title,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    color: palette.notice_description,
  },
});
