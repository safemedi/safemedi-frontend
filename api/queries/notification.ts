import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type FetchNotificationsParams,
  fetchNotifications,
  fetchUnreadNotificationCount,
  patchAllNotificationsRead,
  patchNotificationRead,
} from "@/api/endpoints/notification";
import { queryKeys } from "@/api/query-keys";
import type { NotificationListResponse } from "@/api/types";
import { useSessionStore } from "@/stores/sessionStore";

const STALE_MS = 60 * 1000;
const DEFAULT_PAGE_SIZE = 20;

export function useNotifications(params: FetchNotificationsParams = {}) {
  const accessToken = useSessionStore((s) => s.accessToken);
  const page = params.page ?? 0;
  const size = params.size ?? DEFAULT_PAGE_SIZE;

  return useQuery({
    queryKey: queryKeys.notification.list(page, size),
    enabled: !!accessToken,
    staleTime: STALE_MS,
    queryFn: () => fetchNotifications({ page, size }),
  });
}

export function useUnreadNotificationCount() {
  const accessToken = useSessionStore((s) => s.accessToken);

  return useQuery({
    queryKey: queryKeys.notification.unreadCount,
    enabled: !!accessToken,
    staleTime: STALE_MS,
    queryFn: fetchUnreadNotificationCount,
  });
}

function invalidateNotificationQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([queryClient.invalidateQueries({ queryKey: ["notification"] })]);
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) => patchNotificationRead(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ["notification"] });

      const previousListQueries = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: ["notification", "list"],
      });

      for (const [queryKey, data] of previousListQueries) {
        if (!data) continue;
        queryClient.setQueryData<NotificationListResponse>(queryKey, {
          ...data,
          content: data.content.map((item) =>
            item.notificationId === notificationId ? { ...item, isRead: true } : item,
          ),
        });
      }

      const previousUnread = queryClient.getQueryData<{ unreadCount: number }>(
        queryKeys.notification.unreadCount,
      );
      if (previousUnread && previousUnread.unreadCount > 0) {
        queryClient.setQueryData(queryKeys.notification.unreadCount, {
          unreadCount: previousUnread.unreadCount - 1,
        });
      }

      return { previousListQueries, previousUnread };
    },
    onError: (_error, _notificationId, context) => {
      if (context?.previousListQueries) {
        for (const [queryKey, data] of context.previousListQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      if (context?.previousUnread) {
        queryClient.setQueryData(queryKeys.notification.unreadCount, context.previousUnread);
      }
    },
    onSettled: async () => {
      await invalidateNotificationQueries(queryClient);
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patchAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notification"] });

      const previousListQueries = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: ["notification", "list"],
      });

      for (const [queryKey, data] of previousListQueries) {
        if (!data) continue;
        queryClient.setQueryData<NotificationListResponse>(queryKey, {
          ...data,
          content: data.content.map((item) => ({ ...item, isRead: true })),
        });
      }

      const previousUnread = queryClient.getQueryData<{ unreadCount: number }>(
        queryKeys.notification.unreadCount,
      );
      queryClient.setQueryData(queryKeys.notification.unreadCount, { unreadCount: 0 });

      return { previousListQueries, previousUnread };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousListQueries) {
        for (const [queryKey, data] of context.previousListQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      if (context?.previousUnread) {
        queryClient.setQueryData(queryKeys.notification.unreadCount, context.previousUnread);
      }
    },
    onSettled: async () => {
      await invalidateNotificationQueries(queryClient);
    },
  });
}
