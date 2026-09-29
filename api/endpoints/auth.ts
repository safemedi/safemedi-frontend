import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type {
  LogoutBody,
  LogoutResponse,
  ReissueTokenResponse,
  SocialLoginResponse,
} from "@/api/types/auth";

export async function postSocialLogin(
  provider: "kakao" | "naver",
  accessToken: string,
): Promise<SocialLoginResponse> {
  return api
    .post(apiPaths.authLogin(provider), {
      json: { accessToken },
    })
    .json<SocialLoginResponse>();
}

export async function postLogout(body: LogoutBody): Promise<LogoutResponse> {
  return api.post(apiPaths.authLogout, { json: body }).json<LogoutResponse>();
}

export async function postReissueToken(refreshToken: string): Promise<ReissueTokenResponse> {
  return api
    .post(apiPaths.authReissue, {
      json: { refreshToken },
    })
    .json<ReissueTokenResponse>();
}
