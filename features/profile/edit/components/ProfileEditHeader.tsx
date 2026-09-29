import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { palette } from "@/constants/design-tokens";

export type ProfileEditHeaderProps = {
  onBack?: () => void;
};

export function ProfileEditHeader({ onBack }: ProfileEditHeaderProps) {
  return (
    <XStack items="center" gap={10}>
      <Pressable onPress={onBack} hitSlop={8} style={styles.backButton}>
        <Ionicons name="arrow-back" size={20} color={palette.black} />
      </Pressable>
      <YStack gap={2}>
        <Text style={styles.title}>프로필 수정</Text>
        <Text style={styles.subtitle}>닉네임과 건강 정보를 관리하세요</Text>
      </YStack>
    </XStack>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 21,
    fontWeight: "700",
    lineHeight: 28,
    color: palette.black,
    letterSpacing: -0.35,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
    color: palette.icon,
  },
});
