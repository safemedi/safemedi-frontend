import { StyleSheet } from "react-native";
import { Text, YStack } from "tamagui";

import { palette } from "@/constants/design-tokens";

export function MedicationReportHeader() {
  return (
    <YStack gap={4}>
      <Text style={styles.title}>복약 리포트</Text>
      <Text style={styles.subtitle}>내 건강 관리를 한눈에 확인하세요</Text>
    </YStack>
  );
}

const styles = StyleSheet.create({
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
