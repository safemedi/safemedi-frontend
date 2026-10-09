import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useLogoutMutation } from "@/api/queries/auth";
import { queryKeys } from "@/api/query-keys";
import { runDeviceTokenOperation } from "@/hooks/deviceTokenLifecycle";
import {
  clearPendingDeviceTokenCleanup,
  clearRegisteredDeviceToken,
  getRegisteredDeviceToken,
  markDeviceTokenCleanupPending,
  restoreDeviceTokenState,
} from "@/hooks/pushNotificationTokenStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useUserStore } from "@/stores/userStore";

const AUTH_SCOPED_QUERY_KEY_PREFIXES = [
  queryKeys.user.me,
  ["dashboard"],
  ["medications"],
  ["family"],
  ["profile"],
  ["prescriptions"],
  ["scan"],
  ["map"],
  ["notification"],
] as const;

export interface LogoutOptions {
  readonly reason?: "user-request" | "session-expired";
}

// 여러 인증 게이트에서 동시에 호출되어도 서버 로그아웃은 한 번만 수행한다.
let isLoggingOut = false;

export function useLogout() {
  const queryClient = useQueryClient();
  const { mutateAsync: logoutAsync } = useLogoutMutation();
  const clearSession = useSessionStore((s) => s.clearSession);
  const clearUser = useUserStore((s) => s.clearUser);

  return useCallback(
    async (options?: LogoutOptions) => {
      if (isLoggingOut) {
        return;
      }

      isLoggingOut = true;
      try {
        await runDeviceTokenOperation(async () => {
          await restoreDeviceTokenState();
          const deviceToken = getRegisteredDeviceToken();
          if (deviceToken) {
            // 네트워크 요청 전에 기록해 종료·실패 시에도 정리 작업을 잃지 않는다.
            await markDeviceTokenCleanupPending(deviceToken);
            if (options?.reason !== "session-expired") {
              await logoutAsync({ deviceToken });
              await clearPendingDeviceTokenCleanup(deviceToken);
            }
            await clearRegisteredDeviceToken();
          }
        });
      } catch {
        if (__DEV__) console.warn("[useLogout] 서버 토큰 정리를 보류하고 로컬 세션을 종료합니다.");
      } finally {
        clearSession();
        clearUser();
        for (const queryKey of AUTH_SCOPED_QUERY_KEY_PREFIXES) {
          queryClient.removeQueries({ queryKey });
        }
        isLoggingOut = false;
      }
    },
    [clearSession, clearUser, logoutAsync, queryClient],
  );
}
