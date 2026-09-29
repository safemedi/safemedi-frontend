import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { Text, YStack } from "tamagui";
import { palette } from "@/constants/design-tokens";

interface MedicationWarningBannerProps {
  readonly description: string;
}

export function MedicationWarningBanner({ description }: MedicationWarningBannerProps) {
  return (
    <LinearGradient
      colors={[palette.red_medium, palette.pink]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="warning-outline" size={20} color={palette.white} />
      </View>
      <YStack gap={4} style={styles.textWrap}>
        <Text style={styles.title}>주의가 필요합니다</Text>
        <Text style={styles.description}>{description}</Text>
      </YStack>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  iconWrap: {
    paddingTop: 2,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: palette.white,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  description: {
    color: palette.white,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    opacity: 0.95,
  },
});
