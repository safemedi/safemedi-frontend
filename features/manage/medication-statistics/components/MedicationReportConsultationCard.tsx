import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { palette } from "@/constants/design-tokens";

interface MedicationReportConsultationCardProps {
  readonly message: string;
}

export function MedicationReportConsultationCard({
  message,
}: MedicationReportConsultationCardProps) {
  return (
    <LinearGradient
      colors={[...palette.bg_consultation_card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.card}
    >
      <XStack gap={10} items="flex-start">
        <LinearGradient
          colors={[palette.purple, palette.purple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <MaterialCommunityIcons name="stethoscope" size={18} color={palette.white} />
        </LinearGradient>
        <YStack gap={4} flex={1}>
          <Text style={styles.title}>의사 상담 권장</Text>
          <Text style={styles.message}>{message}</Text>
        </YStack>
      </XStack>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.consultation_card_border,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  iconCircle: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: palette.consultation_card_title,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  message: {
    color: palette.consultation_card_message,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
  },
});
