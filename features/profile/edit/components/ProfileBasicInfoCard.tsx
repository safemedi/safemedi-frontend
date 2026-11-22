import { Pressable, StyleSheet } from "react-native";
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
} from "@/constants/health-profile-options";

export type ProfileBasicInfoCardProps = {
  gender: GenderOptionValue;
  isPregnant: boolean;
  bloodType: BloodTypeOptionValue;
  rhFactor: RhFactorOptionValue;
  onGenderChange: (value: GenderOptionValue) => void;
  onPregnancyChange: (value: boolean) => void;
  onBloodTypeChange: (value: BloodTypeOptionValue) => void;
  onRhFactorChange: (value: RhFactorOptionValue) => void;
};

export function ProfileBasicInfoCard({
  gender,
  isPregnant,
  bloodType,
  rhFactor,
  onGenderChange,
  onPregnancyChange,
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

        {gender === "female" ? (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel="임산부"
            accessibilityState={{ checked: isPregnant }}
            onPress={() => onPregnancyChange(!isPregnant)}
            style={styles.pregnancyRow}
          >
            <Text style={styles.title}>임산부</Text>
            <Text style={[styles.checkbox, isPregnant && styles.checkboxChecked]}>
              {isPregnant ? "✓" : ""}
            </Text>
          </Pressable>
        ) : null}

        <YStack gap={8}>
          <Text style={styles.title}>혈액형</Text>
          <XStack gap={8} alignItems="center">
            {bloodOptions.map((option) => (
              <SelectChip
                key={option.value}
                label={option.label}
                selected={bloodType === option.value}
                onPress={() => onBloodTypeChange(option.value)}
                flex={1}
                px={8}
              />
            ))}
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel="Rh-"
              accessibilityState={{ checked: rhFactor === "negative" }}
              onPress={() => onRhFactorChange(rhFactor === "negative" ? "positive" : "negative")}
              style={styles.rhCheckboxRow}
            >
              <Text style={styles.rhLabel}>Rh-</Text>
              <Text style={[styles.checkbox, rhFactor === "negative" && styles.checkboxChecked]}>
                {rhFactor === "negative" ? "✓" : ""}
              </Text>
            </Pressable>
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
  pregnancyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
  },
  rhCheckboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 44,
  },
  rhLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: palette.black,
  },
  checkbox: {
    width: 22,
    height: 22,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: palette.dark_gray,
    textAlign: "center",
    color: palette.white,
    fontSize: 17,
    lineHeight: 20,
  },
  checkboxChecked: {
    backgroundColor: palette.black,
    borderColor: palette.black,
  },
});
