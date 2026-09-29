import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text } from "react-native";
import { YStack } from "tamagui";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { palette } from "@/constants/design-tokens";

import { HealthInfoCard } from "./HealthInfoCard";

export type HealthInfoSectionProps = {
  allergies: readonly string[];
  chronicConditions: readonly string[];
  onDetailPress?: () => void;
  onEditAllergies?: () => void;
  onEditChronicConditions?: () => void;
};

export function HealthInfoSection({
  allergies,
  chronicConditions,
  onDetailPress,
  onEditAllergies,
  onEditChronicConditions,
}: HealthInfoSectionProps) {
  return (
    <YStack gap={10}>
      <SectionHeader
        icon={<Ionicons name="shield-checkmark-outline" size={16} color={palette.black} />}
        title="건강 정보"
        action={
          <Pressable
            onPress={onDetailPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="건강 정보 상세보기"
          >
            <Text style={styles.actionText}>상세보기</Text>
          </Pressable>
        }
      />
      <HealthInfoCard
        variant="allergy"
        icon={<Ionicons name="warning-outline" size={16} color={palette.red_deep} />}
        title="알러지"
        items={allergies}
        onEdit={onEditAllergies}
      />
      <HealthInfoCard
        variant="chronic"
        icon={<Ionicons name="medkit-outline" size={16} color={palette.blue_deep} />}
        title="기저질환"
        items={chronicConditions}
        onEdit={onEditChronicConditions}
      />
    </YStack>
  );
}

const styles = StyleSheet.create({
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.green_deep,
  },
});
