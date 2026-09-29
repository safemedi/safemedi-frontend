import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { palette } from "@/constants/design-tokens";

interface DashboardTopHeaderProps {
  readonly onPressNotification: () => void;
  readonly hasUnreadNotification: boolean;
}

export function DashboardTopHeader({
  onPressNotification,
  hasUnreadNotification,
}: DashboardTopHeaderProps) {
  return (
    <XStack items="center" justify="space-between" width="100%">
      <YStack gap={2}>
        <Text style={styles.title}>안녕하세요! 👋</Text>
        <Text style={styles.subtitle}>오늘도 건강한 하루 되세요</Text>
      </YStack>
      <Pressable
        style={styles.notificationButton}
        accessibilityRole="button"
        accessibilityLabel="알림 화면 열기"
        onPress={onPressNotification}
      >
        <Ionicons name="notifications-outline" size={18} color={palette.icon} />
        {hasUnreadNotification ? <View style={styles.unreadDot} /> : null}
      </Pressable>
    </XStack>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "700",
    color: palette.black,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: palette.icon,
  },
  notificationButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.white,
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  unreadDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: palette.white,
    backgroundColor: palette.red_medium,
  },
});
