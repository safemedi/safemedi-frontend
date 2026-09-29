import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

import { useLogoutMutation } from "@/api/queries/auth";
import { queryKeys } from "@/api/query-keys";
import {
  clearRegisteredDeviceToken,
  getRegisteredDeviceToken,
} from "@/hooks/pushNotificationTokenStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useUserStore } from "@/stores/userStore";

const AUTH_SCOPED_QUERY_KEY_PREFIXES = [
  queryKeys.user.me,
  ["dashboard"],
  ["family"],
  ["profile"],
  ["prescriptions"],
  ["scan"],
  ["map"],
  ["notification"],
] as const;

export function useLogout() {
  const queryClient = useQueryClient();
  const { mutateAsync: logoutAsync } = useLogoutMutation();
  const clearSession = useSessionStore((s) => s.clearSession);
  const clearUser = useUserStore((s) => s.clearUser);
  const isLoggingOutRef = useRef(false);

  return useCallback(async () => {
    if (isLoggingOutRef.current) {
      return;
    }

    isLoggingOutRef.current = true;
    const deviceToken = getRegisteredDeviceToken();
    let didLogoutOnServer = false;

    try {
      if (deviceToken) {
        await logoutAsync({ deviceToken });
        didLogoutOnServer = true;
      }
    } catch (error) {
      if (__DEV__) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[useLogout] 로그아웃 API 호출 실패: ${message}`);
      }
    } finally {
      if (didLogoutOnServer) {
        clearRegisteredDeviceToken();
      }
      clearSession();
      clearUser();
      for (const queryKey of AUTH_SCOPED_QUERY_KEY_PREFIXES) {
        queryClient.removeQueries({ queryKey });
      }
      isLoggingOutRef.current = false;
    }
  }, [clearSession, clearUser, logoutAsync, queryClient]);
}
