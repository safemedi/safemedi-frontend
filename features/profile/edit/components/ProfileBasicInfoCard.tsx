import { StyleSheet } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { SelectChip } from "@/components/ui/SelectChip";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import {
  type BloodTypeOptionValue,
  bloodOptions,
  type GenderOptionValue,
  genderOptions,
  type RhFactorOptionValue,
  rhOptions,
} from "@/constants/health-profile-options";

export type ProfileBasicInfoCardProps = {
  gender: GenderOptionValue;
  bloodType: BloodTypeOptionValue;
  rhFactor: RhFactorOptionValue;
  onGenderChange: (value: GenderOptionValue) => void;
  onBloodTypeChange: (value: BloodTypeOptionValue) => void;
  onRhFactorChange: (value: RhFactorOptionValue) => void;
};

export function ProfileBasicInfoCard({
  gender,
  bloodType,
  rhFactor,
  onGenderChange,
  onBloodTypeChange,
  onRhFactorChange,
}: ProfileBasicInfoCardProps) {
  return (
    <SurfaceCard style={styles.card}>
      <YStack gap={14}>
        <YStack gap={8}>
          <Text style={styles.title}>성별</Text>
          <XStack gap={8}>
            {genderOptions.map((option) => (
              <SelectChip
                key={option.value}
                label={option.label}
                selected={gender === option.value}
                onPress={() => onGenderChange(option.value)}
                flex={1}
              />
            ))}
          </XStack>
        </YStack>

        <YStack gap={8}>
          <Text style={styles.title}>혈액형</Text>
          <XStack gap={8} flexWrap="wrap">
            {bloodOptions.map((option) => (
              <SelectChip
                key={option.value}
                label={option.label}
                selected={bloodType === option.value}
                onPress={() => onBloodTypeChange(option.value)}
              />
            ))}
          </XStack>
          <XStack gap={8}>
            {rhOptions.map((option) => (
              <SelectChip
                key={option.value}
                label={option.label}
                selected={rhFactor === option.value}
                onPress={() => onRhFactorChange(option.value)}
                flex={1}
              />
            ))}
          </XStack>
        </YStack>
      </YStack>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  title: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    color: palette.black,
    letterSpacing: -0.15,
  },
});
