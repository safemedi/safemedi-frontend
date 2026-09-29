import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchNotificationSettings, patchNotificationSettings } from "@/api/endpoints/notification";
import { queryKeys } from "@/api/query-keys";
import type { NotificationSettings } from "@/api/types";
import { useSessionStore } from "@/stores/sessionStore";
import { useFamilies } from "./family";

const STALE_MS = 5 * 60 * 1000;
type NotificationSettingsPatch = Partial<
  Pick<NotificationSettings, "isMyReminderOn" | "isFamilyReminderOn" | "isMissedAlertOn">
>;

const NOTIFICATION_SETTING_KEYS = [
  "isMyReminderOn",
  "isFamilyReminderOn",
  "isMissedAlertOn",
] as const;

export function useFamilyProfiles() {
  return useFamilies();
}

/** 알림 설정 조회 */
export function useNotificationSettings() {
  const accessToken = useSessionStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.profile.notificationSettings,
    enabled: !!accessToken,
    staleTime: STALE_MS,
    queryFn: fetchNotificationSettings,
  });
}

/** 알림 설정 변경 */
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: NotificationSettingsPatch) => patchNotificationSettings(body),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.profile.notificationSettings });

      const previous = queryClient.getQueryData<NotificationSettings>(
        queryKeys.profile.notificationSettings,
      );

      if (previous) {
        queryClient.setQueryData<NotificationSettings>(queryKeys.profile.notificationSettings, {
          ...previous,
          ...patch,
        });
      }

      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData<NotificationSettings>(
          queryKeys.profile.notificationSettings,
          (current) => {
            if (!current) return context.previous;

            const next = { ...current };
            for (const key of NOTIFICATION_SETTING_KEYS) {
              if (_patch[key] !== undefined && current[key] === _patch[key]) {
                next[key] = context.previous[key];
              }
            }
            return next;
          },
        );
      }
    },
    onSuccess: (updated, patch) => {
      queryClient.setQueryData<NotificationSettings>(
        queryKeys.profile.notificationSettings,
        (current) => {
          if (!current) return updated;

          const next = { ...current };
          for (const key of NOTIFICATION_SETTING_KEYS) {
            if (patch[key] !== undefined && current[key] === patch[key]) {
              next[key] = updated[key];
            }
          }
          return next;
        },
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile.notificationSettings });
    },
  });
}
