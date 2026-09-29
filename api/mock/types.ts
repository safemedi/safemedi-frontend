export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type MockHandlerContext = {
  method: HttpMethod;
  /** 요청 pathname (`/api/v1/...`) */
  path: string;
  searchParams: URLSearchParams;
  /** POST/PATCH 등 JSON 본문 (없으면 undefined) */
  jsonBody: unknown;
};

export type MockHandler<T = unknown> = (ctx: MockHandlerContext) => T | Promise<T | Response>;

export type MockRoute = {
  /** 디버깅·list용 라벨 */
  label: string;
  match: (method: HttpMethod, pathname: string) => boolean;
  handler: MockHandler;
  delayMs?: number;
  status?: number;
};
