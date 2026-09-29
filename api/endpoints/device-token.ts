import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type {
  RegisterDeviceTokenBody,
  RegisterDeviceTokenResponse,
} from "@/api/types/notification";

export async function postDeviceToken(
  body: RegisterDeviceTokenBody,
): Promise<RegisterDeviceTokenResponse> {
  return api.post(apiPaths.usersDeviceToken, { json: body }).json<RegisterDeviceTokenResponse>();
}
