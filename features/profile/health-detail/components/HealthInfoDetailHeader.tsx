import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { palette } from "@/constants/design-tokens";

export interface HealthInfoDetailHeaderProps {
  readonly onBack: () => void;
}

export function HealthInfoDetailHeader({ onBack }: HealthInfoDetailHeaderProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onBack}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="건강 정보 확인 뒤로가기"
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={20} color={palette.black} />
      </Pressable>
      <View style={styles.textWrap}>
        <Text style={styles.title}>건강 정보 확인</Text>
        <Text style={styles.subtitle}>의사에게 제공할 정보</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    gap: 2,
  },
  title: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "700",
    color: palette.black,
    letterSpacing: -0.35,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
    color: palette.icon,
  },
});
