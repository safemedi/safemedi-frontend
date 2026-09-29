import { apiConfig } from "@/constants/api-config";

/**
 * ky가 넘기는 URL에서 pathname을 뽑습니다.
 * React Native 등에서는 `Request.url`이 상대 경로(`/api/v1/...`)만 올 수 있어
 * `new URL(절대만)` 대신 `new URL(input, apiBase)`로 해석합니다.
 */
export function pathRelativeToApiBase(
  requestUrl: string,
  apiBaseUrl: string = apiConfig.baseUrl,
): { pathname: string; searchParams: URLSearchParams } {
  const baseString = apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`;
  const req = new URL(requestUrl, baseString);
  let pathname = req.pathname;

  if (!pathname.startsWith("/")) pathname = `/${pathname}`;

  return { pathname, searchParams: req.searchParams };
}
