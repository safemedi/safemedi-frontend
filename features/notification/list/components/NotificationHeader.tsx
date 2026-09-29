import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, YStack } from "tamagui";

import { palette } from "@/constants/design-tokens";

interface NotificationHeaderProps {
  readonly unreadCount: number;
  readonly onPressBack: () => void;
  readonly onPressMarkAllRead: () => void;
  readonly isMarkAllReadDisabled: boolean;
}

export function NotificationHeader({
  unreadCount,
  onPressBack,
  onPressMarkAllRead,
  isMarkAllReadDisabled,
}: NotificationHeaderProps) {
  const subtitle = unreadCount > 0 ? `${unreadCount}개의 새 알림` : "새로운 알림이 없습니다";

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="이전 화면으로 이동"
        onPress={onPressBack}
        style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
      >
        <Ionicons name="arrow-back" size={20} color={palette.title_emphasis} />
      </Pressable>

      <YStack flex={1} gap={2}>
        <Text style={styles.title}>알림</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </YStack>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="모두 읽음"
        disabled={isMarkAllReadDisabled}
        onPress={onPressMarkAllRead}
        style={({ pressed }) => [
          styles.markAllButton,
          isMarkAllReadDisabled ? styles.markAllButtonDisabled : null,
          pressed && !isMarkAllReadDisabled ? styles.pressed : null,
        ]}
      >
        <Text
          style={[styles.markAllText, isMarkAllReadDisabled ? styles.markAllTextDisabled : null]}
        >
          모두 읽음
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: palette.title_emphasis,
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "700",
    letterSpacing: -0.36,
  },
  subtitle: {
    color: palette.icon,
    fontSize: 12.25,
    lineHeight: 17.5,
    letterSpacing: -0.02,
  },
  markAllButton: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  markAllButtonDisabled: {
    opacity: 0.4,
  },
  markAllText: {
    color: palette.green_deep,
    fontSize: 12.25,
    lineHeight: 17.5,
    fontWeight: "500",
    letterSpacing: -0.02,
  },
  markAllTextDisabled: {
    color: palette.input_placeholder,
  },
  pressed: {
    opacity: 0.6,
  },
});
