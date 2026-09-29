import { router } from "expo-router";
import { useCallback, useMemo } from "react";

import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/api/queries/notification";
import type { NotificationItem } from "@/api/types";

export interface NotificationsViewModel {
  readonly items: readonly NotificationItem[];
  readonly unreadCount: number;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly isMarkAllReadPending: boolean;
  readonly refetch: () => Promise<unknown>;
  readonly handlePressBack: () => void;
  readonly handlePressMarkAllRead: () => void;
  readonly handlePressNotification: (item: NotificationItem) => void;
}

function navigateToNotificationTarget(item: NotificationItem): void {
  if (item.targetType === "PRESCRIPTION" && item.targetId !== null) {
    router.push({
      pathname: "/(detail)/dashboard/medication-history",
      params: { prescriptionId: String(item.targetId) },
    });
    return;
  }

  if (item.targetType === "MEDICATION_RECORD") {
    router.push("/(tabs)/dashboard");
    return;
  }

  if (item.targetType === "REPORT") {
    router.push("/(tabs)/manage");
  }
}

export function useNotificationsViewModel(): NotificationsViewModel {
  const notificationsQuery = useNotifications();
  const unreadCountQuery = useUnreadNotificationCount();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const items = useMemo(
    () => notificationsQuery.data?.content ?? [],
    [notificationsQuery.data?.content],
  );

  const unreadCount = unreadCountQuery.data?.unreadCount ?? 0;

  const handlePressBack = useCallback(() => {
    router.back();
  }, []);

  const handlePressMarkAllRead = useCallback(() => {
    if (unreadCount === 0 || markAllReadMutation.isPending) {
      return;
    }
    markAllReadMutation.mutate();
  }, [markAllReadMutation, unreadCount]);

  const handlePressNotification = useCallback(
    (item: NotificationItem) => {
      if (!item.isRead) {
        markReadMutation.mutate(item.notificationId);
      }
      navigateToNotificationTarget(item);
    },
    [markReadMutation],
  );

  return {
    items,
    unreadCount,
    isLoading: notificationsQuery.isLoading,
    isError: notificationsQuery.isError,
    isMarkAllReadPending: markAllReadMutation.isPending,
    refetch: notificationsQuery.refetch,
    handlePressBack,
    handlePressMarkAllRead,
    handlePressNotification,
  };
}
