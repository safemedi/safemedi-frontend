import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { Badge } from "@/components/ui/Badge";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";

type FamilyMedicationScheduleItem = {
  id: string;
  medicineName: string;
  scheduledTime: string;
  status: "COMPLETED" | "PENDING";
};

interface FamilyMedicationScheduleCardProps {
  readonly schedule: FamilyMedicationScheduleItem;
}

export function FamilyMedicationScheduleCard({ schedule }: FamilyMedicationScheduleCardProps) {
  const isCompleted = schedule.status === "COMPLETED";

  return (
    <SurfaceCard style={[styles.card, isCompleted ? styles.completedCard : styles.pendingCard]}>
      {isCompleted ? (
        <LinearGradient
          colors={[...palette.bg_family_active_card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.completedOverlay}
        />
      ) : null}
      <XStack items="center" justify="space-between" gap={12}>
        <XStack items="center" gap={10} flex={1}>
          <View
            style={[
              styles.iconWrap,
              isCompleted ? styles.completedIconWrap : styles.pendingIconWrap,
            ]}
          >
            <Ionicons
              name={isCompleted ? "checkmark-circle" : "ellipse-outline"}
              size={20}
              color={palette.white}
            />
          </View>
          <YStack gap={2} flex={1}>
            <Text style={[styles.name, isCompleted && styles.completedName]}>
              {schedule.medicineName}
            </Text>
            <Text style={[styles.time, isCompleted && styles.completedTime]}>
              {schedule.scheduledTime} 복용
            </Text>
          </YStack>
        </XStack>
        <Badge
          label={isCompleted ? "완료" : "대기"}
          backgroundColor={isCompleted ? palette.green : palette.opal}
          textColor={palette.white}
        />
      </XStack>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    position: "relative",
    overflow: "hidden",
  },
  completedCard: {
    borderColor: palette.light_green,
  },
  pendingCard: {
    backgroundColor: palette.surface_card,
  },
  completedOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  completedIconWrap: {
    backgroundColor: palette.green,
  },
  pendingIconWrap: {
    backgroundColor: palette.opal,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.black,
    letterSpacing: -0.15,
  },
  completedName: {
    color: palette.green_deep,
  },
  time: {
    fontSize: 12,
    color: palette.icon,
    lineHeight: 17,
  },
  completedTime: {
    color: palette.green_deep,
  },
});
