import { StyleSheet } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { palette } from "@/constants/design-tokens";

export function MedicationManagementSectionHeader() {
  return (
    <YStack gap={4} mb={4}>
      <XStack items="center" gap={8}>
        <Text style={styles.emoji}>💊</Text>
        <Text style={styles.title}>복약 관리</Text>
      </XStack>
      <Text style={styles.subtitle}>등록된 약물을 수정하거나 삭제할 수 있습니다</Text>
    </YStack>
  );
}

const styles = StyleSheet.create({
  emoji: {
    fontSize: 18,
    lineHeight: 24,
  },
  title: {
    color: palette.title_emphasis,
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: palette.icon,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
  },
});
