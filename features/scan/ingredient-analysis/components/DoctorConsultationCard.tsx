import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";
import { Text } from "tamagui";
import { GradientCard } from "@/components/ui/GradientCard";
import { palette } from "@/constants/design-tokens";

interface DoctorConsultationCardProps {
  readonly message: string;
}

export function DoctorConsultationCard({ message }: DoctorConsultationCardProps) {
  return (
    <GradientCard gradientColors={palette.bg_allergy_card} style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="warning-outline" size={16} color={palette.white} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>의사 상담 필수</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </GradientCard>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.red_soft,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.red_medium,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: palette.red_deep,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  message: {
    color: palette.red_quick_text,
    fontSize: 12,
    lineHeight: 17,
  },
});
