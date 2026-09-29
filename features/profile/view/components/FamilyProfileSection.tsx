import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text } from "react-native";
import { YStack } from "tamagui";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { palette } from "@/constants/design-tokens";
import { FamilyProfileItem } from "./FamilyProfileItem";

export type FamilyProfile = {
  id: string;
  name: string;
  relation: string;
  isActive: boolean;
  avatarGradient: readonly [string, string];
};

export type FamilyProfileSectionProps = {
  profiles: readonly FamilyProfile[];
  onAddFamily?: () => void;
};

export function FamilyProfileSection({ profiles, onAddFamily }: FamilyProfileSectionProps) {
  return (
    <YStack gap={10}>
      <SectionHeader
        icon={<Ionicons name="people-outline" size={16} color={palette.black} />}
        title="가족 프로필"
        action={
          <Pressable onPress={onAddFamily} hitSlop={8}>
            <Text style={styles.actionText}>+ 가족 추가</Text>
          </Pressable>
        }
      />
      <YStack gap={7}>
        {profiles.map((profile) => (
          <FamilyProfileItem
            key={profile.id}
            name={profile.name}
            relation={profile.relation}
            isActive={profile.isActive}
            avatarGradient={profile.avatarGradient}
          />
        ))}
      </YStack>
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
