import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { palette } from "@/constants/design-tokens";

export interface MedicalGuideCardProps {
  readonly description: string;
}

export function MedicalGuideCard({ description }: MedicalGuideCardProps) {
  return (
    <LinearGradient
      colors={[...palette.bg_green_line]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.row}>
        <Ionicons name="document-text-outline" size={18} color={palette.white} />
        <View style={styles.textWrap}>
          <Text style={styles.title}>의료진 확인용 정보</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    color: palette.white,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    color: palette.white,
    opacity: 0.95,
  },
});
