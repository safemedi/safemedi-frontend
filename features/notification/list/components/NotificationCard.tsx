import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import type { NotificationItem } from "@/api/types";
import { palette } from "@/constants/design-tokens";
import { formatNotificationRelativeTime } from "@/utils/format-relative-time";
import { getNotificationPresentation } from "../notificationPresentation";

interface NotificationCardProps {
  readonly item: NotificationItem;
  readonly onPress: (item: NotificationItem) => void;
}

export function NotificationCard({ item, onPress }: NotificationCardProps) {
  const presentation = getNotificationPresentation(item.type);
  const isUnread = !item.isRead;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.message}`}
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.card,
        isUnread ? styles.cardUnread : styles.cardRead,
        pressed ? styles.pressed : null,
      ]}
    >
      <XStack gap={10} items="flex-start">
        <LinearGradient
          colors={[...presentation.gradientColors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <Ionicons name={presentation.iconName} size={18} color={palette.white} />
        </LinearGradient>

        <YStack flex={1} gap={4}>
          <XStack items="center" justify="space-between">
            <Text style={[styles.title, isUnread ? styles.titleUnread : styles.titleRead]}>
              {item.title}
            </Text>
            {isUnread ? <View style={styles.unreadDot} /> : null}
          </XStack>

          <Text style={[styles.message, isUnread ? styles.messageUnread : styles.messageRead]}>
            {item.message}
          </Text>

          <XStack items="center" justify="space-between">
            <Text style={styles.timeLabel}>{formatNotificationRelativeTime(item.createdAt)}</Text>
            {presentation.showActionBadge ? (
              <View style={styles.actionBadge}>
                <Text style={styles.actionBadgeText}>확인 필요</Text>
              </View>
            ) : null}
          </XStack>
        </YStack>
      </XStack>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  cardUnread: {
    backgroundColor: palette.white,
    borderColor: palette.green_soft,
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardRead: {
    backgroundColor: palette.overlay_white_70,
    borderColor: palette.dark_gray,
  },
  pressed: {
    opacity: 0.85,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
    letterSpacing: -0.15,
  },
  titleUnread: {
    color: palette.title_emphasis,
  },
  titleRead: {
    color: palette.black,
  },
  message: {
    fontSize: 12.25,
    lineHeight: 17.5,
    letterSpacing: -0.02,
  },
  messageUnread: {
    color: palette.black,
  },
  messageRead: {
    color: palette.icon,
  },
  timeLabel: {
    fontSize: 10.5,
    lineHeight: 14,
    color: palette.input_placeholder,
    letterSpacing: 0.09,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.green,
    marginLeft: 8,
  },
  actionBadge: {
    backgroundColor: palette.risk_danger_badge_bg,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  actionBadgeText: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: "500",
    color: palette.red_quick_text,
    letterSpacing: 0.09,
  },
});
