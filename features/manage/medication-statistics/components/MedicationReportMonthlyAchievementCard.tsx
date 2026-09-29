import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { palette } from "@/constants/design-tokens";

interface MedicationReportMonthlyAchievementCardProps {
  readonly achievements: readonly string[];
}

export function MedicationReportMonthlyAchievementCard({
  achievements,
}: MedicationReportMonthlyAchievementCardProps) {
  if (achievements.length === 0) {
    return null;
  }

  return (
    <LinearGradient
      colors={[...palette.bg_achievement_card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.card}
    >
      <Text style={styles.title}>🏆 이번 달 성과</Text>

      <YStack gap={7} mt={12}>
        {achievements.map((achievement) => (
          <XStack key={achievement} items="center" gap={7}>
            <MaterialCommunityIcons
              name="check-circle"
              size={14}
              color={palette.risk_safe_badge_text}
            />
            <Text style={styles.achievementText}>{achievement}</Text>
          </XStack>
        ))}
      </YStack>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.light_green,
    paddingHorizontal: 19,
    paddingVertical: 19,
  },
  title: {
    color: palette.achievement_card_title,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
  achievementText: {
    color: palette.risk_safe_badge_text,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
    flex: 1,
  },
});
