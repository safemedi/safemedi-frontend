import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useRegisterDeviceTokenMutation } from "@/api/queries/device-token";
import { queryKeys } from "@/api/query-keys";
import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
  registerPushTokenWithBackend,
} from "@/hooks/pushNotifications";
import { useSessionHydrated } from "@/hooks/useSessionHydrated";
import { useSessionStore } from "@/stores/sessionStore";

function warnPushTokenRegistration(message: string): void {
  if (!__DEV__) {
    return;
  }

  console.warn(`[PushNotificationSync] ${message}`);
}

/**
 * 로그인 후 FCM 디바이스 토큰을 서버에 등록하고, 푸시 수신 시 알림/대시보드 쿼리를 갱신합니다.
 */
export function PushNotificationSync() {
  const hydrated = useSessionHydrated();
  const accessToken = useSessionStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const { mutateAsync: registerDeviceToken } = useRegisterDeviceTokenMutation();

  useEffect(() => {
    if (!hydrated || !accessToken) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    void registerDeviceToken({ accessToken, signal: controller.signal })
      .then(() =>
        registerPushTokenWithBackend(async (body) => {
          if (cancelled) return;
          await registerDeviceToken({ body, accessToken, signal: controller.signal });
        }),
      )
      .then((result) => {
        if (cancelled || result.status === "registered") {
          return;
        }
        warnPushTokenRegistration(`FCM 디바이스 토큰 등록 스킵 (${result.reason})`);
      })
      .catch(() => {
        if (!cancelled) warnPushTokenRegistration("FCM 디바이스 토큰 등록 실패");
      });

    const invalidatePushDrivenQueries = () => {
      void queryClient.invalidateQueries({ queryKey: ["notification"] });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.todayMedicationSchedules,
      });
    };

    const receivedSubscription = addNotificationReceivedListener(() => {
      invalidatePushDrivenQueries();
    });
    const responseSubscription = addNotificationResponseListener(() => {
      invalidatePushDrivenQueries();
    });

    return () => {
      cancelled = true;
      controller.abort();
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [hydrated, accessToken, queryClient, registerDeviceToken]);

  return null;
}
