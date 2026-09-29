import { StyleSheet } from "react-native";
import { Text, YStack } from "tamagui";

import { palette } from "@/constants/design-tokens";

export function ProfilePageHeader() {
  return (
    <YStack gap={4}>
      <Text style={styles.title}>프로필</Text>
      <Text style={styles.subtitle}>내 정보와 설정을 관리하세요</Text>
    </YStack>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: palette.text,
    letterSpacing: -0.35,
  },
  subtitle: {
    fontSize: 12,
    color: palette.icon,
    lineHeight: 17,
  },
});
