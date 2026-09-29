import Ionicons from "@expo/vector-icons/Ionicons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { palette } from "@/constants/design-tokens";

interface FamilyScreenHeaderProps {
  readonly title: string;
  readonly subtitle: string;
  readonly onBack?: () => void;
  readonly rightAction?: ReactNode;
}

export function FamilyScreenHeader({
  title,
  subtitle,
  onBack,
  rightAction,
}: FamilyScreenHeaderProps) {
  return (
    <XStack items="center" justify="space-between" gap={10}>
      <XStack items="center" gap={10} flex={1}>
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={styles.backButton}
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={20} color={palette.black} />
        </Pressable>
        <YStack gap={2} flex={1}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </YStack>
      </XStack>
      {rightAction}
    </XStack>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 21,
    fontWeight: "700",
    lineHeight: 28,
    color: palette.black,
    letterSpacing: -0.35,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
    color: palette.icon,
  },
});
