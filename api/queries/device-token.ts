import { useMutation } from "@tanstack/react-query";
import {
  type DeviceTokenRequestOptions,
  deleteDeviceToken,
  postDeviceToken,
} from "@/api/endpoints/device-token";
import { parseApiError } from "@/api/error";
import { queryKeys } from "@/api/query-keys";
import type { RegisterDeviceTokenBody } from "@/api/types/notification";
import { runDeviceTokenOperation } from "@/hooks/deviceTokenLifecycle";
import {
  clearPendingDeviceTokenCleanup,
  getPendingDeviceTokenCleanups,
  restoreDeviceTokenState,
} from "@/hooks/pushNotificationTokenStore";
import { useSessionStore } from "@/stores/sessionStore";

interface RegisterDeviceTokenVariables extends DeviceTokenRequestOptions {
  readonly body?: RegisterDeviceTokenBody;
}

function assertCurrentSession(options: DeviceTokenRequestOptions): void {
  if (options.signal.aborted || useSessionStore.getState().accessToken !== options.accessToken) {
    throw new Error("취소된 디바이스 토큰 등록입니다.");
  }
}

export function useRegisterDeviceTokenMutation() {
  return useMutation({
    mutationKey: queryKeys.user.registerDeviceToken,
    mutationFn: (variables: RegisterDeviceTokenVariables) =>
      runDeviceTokenOperation(async () => {
        assertCurrentSession(variables);
        await restoreDeviceTokenState();
        for (const token of getPendingDeviceTokenCleanups()) {
          assertCurrentSession(variables);
          try {
            await deleteDeviceToken(token, variables);
            await clearPendingDeviceTokenCleanup(token);
          } catch (error) {
            assertCurrentSession(variables);
            const parsed = await parseApiError(error);
            if (parsed.status === 404 && parsed.code === "NOTI_002") {
              await clearPendingDeviceTokenCleanup(token);
            } else if (!(parsed.status === 403 && parsed.code === "NOTI_001")) {
              // 인증·네트워크·서버 오류는 보류 기록을 유지하고 다음 등록 시 재시도한다.
              throw error;
            }
            // 다른 계정 소유 토큰은 삭제하지 않는다. 서버의 현재 토큰 재등록으로 소유권을 갱신한다.
          }
        }
        assertCurrentSession(variables);
        if (!variables.body) return;
        const response = await postDeviceToken(variables.body, variables);
        // 현재 토큰의 재등록 성공은 이전 계정과의 연결도 교체한다(서버 registerDeviceToken 계약).
        await clearPendingDeviceTokenCleanup(variables.body.deviceToken);
        return response;
      }),
  });
}
