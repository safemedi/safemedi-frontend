/** POST /api/v1/auth/login/:provider */
export type SocialLoginResponse = {
  accessToken: string;
  refreshToken: string;
  isTutorialCompleted: boolean;
};

/** POST /api/v1/auth/logout 요청 */
export type LogoutBody = {
  deviceToken: string;
};

/** POST /api/v1/auth/logout 응답 */
export type LogoutResponse = {
  message: string;
};

/** POST /api/v1/auth/reissue 요청 */
export type ReissueTokenBody = {
  refreshToken: string;
};

/** POST /api/v1/auth/reissue 응답 */
export type ReissueTokenResponse = {
  accessToken: string;
  refreshToken: string;
};
