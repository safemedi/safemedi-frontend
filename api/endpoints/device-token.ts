import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type {
  RegisterDeviceTokenBody,
  RegisterDeviceTokenResponse,
} from "@/api/types/notification";

export interface DeviceTokenRequestOptions {
  readonly accessToken: string;
  readonly signal: AbortSignal;
}

function requestOptions(options?: DeviceTokenRequestOptions) {
  return options
    ? {
        headers: { Authorization: `Bearer ${options.accessToken}` },
        signal: options.signal,
        context: { skipAuthRefresh: true },
      }
    : {};
}

export async function postDeviceToken(
  body: RegisterDeviceTokenBody,
  options?: DeviceTokenRequestOptions,
): Promise<RegisterDeviceTokenResponse> {
  return api
    .post(apiPaths.usersDeviceToken, { json: body, ...requestOptions(options) })
    .json<RegisterDeviceTokenResponse>();
}

/** 인증된 사용자 소유의 푸시 연결만 해제한다. 로그아웃과 달리 세션을 폐기하지 않는다. */
export async function deleteDeviceToken(
  deviceToken: string,
  options: DeviceTokenRequestOptions,
): Promise<void> {
  await api
    .delete(apiPaths.usersDeviceToken, {
      searchParams: { deviceToken },
      ...requestOptions(options),
    })
    .json();
}
