import { api } from "@/api/client";
import { normalizeUserProfile } from "@/api/normalize/user-profile";
import { apiPaths } from "@/api/paths";
import type {
  DeleteUserAccountResponse,
  UpdateUserProfileBody,
  UserProfile,
} from "@/api/types/user";

export async function fetchUserProfile(): Promise<UserProfile> {
  const raw = await api.get(apiPaths.usersMe).json<Parameters<typeof normalizeUserProfile>[0]>();
  return normalizeUserProfile(raw);
}

/** 로그인 직후 등 스토어 반영 전에도 동일 JWT로 프로필을 가져올 때 사용 */
export async function fetchUserProfileWithAccessToken(accessToken: string): Promise<UserProfile> {
  const raw = await api
    .get(apiPaths.usersMe, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<Parameters<typeof normalizeUserProfile>[0]>();
  return normalizeUserProfile(raw);
}

export async function patchUserProfile(body: UpdateUserProfileBody): Promise<UserProfile> {
  const raw = await api
    .patch(apiPaths.usersMe, { json: body })
    .json<Parameters<typeof normalizeUserProfile>[0]>();
  return normalizeUserProfile(raw);
}

export async function deleteUserAccount(): Promise<DeleteUserAccountResponse> {
  return api.delete(apiPaths.usersMe).json<DeleteUserAccountResponse>();
}
