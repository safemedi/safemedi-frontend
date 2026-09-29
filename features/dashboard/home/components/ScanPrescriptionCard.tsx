import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { GradientCard } from "@/components/ui/GradientCard";
import { palette } from "@/constants/design-tokens";

interface ScanPrescriptionCardProps {
  readonly onPress: () => void;
}

const SCAN_GRADIENT_COLORS = [palette.green, palette.opal] as const;

export function ScanPrescriptionCard({ onPress }: ScanPrescriptionCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="처방전 스캔하기"
    >
      <GradientCard gradientColors={SCAN_GRADIENT_COLORS} style={styles.gradient}>
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <Ionicons name="scan-outline" size={18} color={palette.white} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>처방전 스캔하기</Text>
            <Text style={styles.description}>약물 성분을 안전하게 분석해요</Text>
          </View>
        </View>
      </GradientCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  pressed: {
    opacity: 0.9,
  },
  gradient: {
    borderRadius: 14,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.overlay_white_20,
  },
  title: {
    color: palette.white,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },
  description: {
    color: palette.overlay_white_92,
    fontSize: 12,
    lineHeight: 16,
  },
});
