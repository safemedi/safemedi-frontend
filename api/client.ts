import * as Sentry from "@sentry/react-native";
import ky, { HTTPError, type KyInstance, TimeoutError } from "ky";
import { mockRegistry, resolveFetchImplementation } from "@/api/mock";
import { apiPaths } from "@/api/paths";
import { refreshAccessToken } from "@/api/token-refresh";
import { apiConfig } from "@/constants/api-config";
import { useSessionStore } from "@/stores/sessionStore";

const fetchImpl = resolveFetchImplementation(mockRegistry);

type KyRequestError = {
  request?: Request;
};

const SENSITIVE_LOG_KEYS = new Set(["accessToken", "refreshToken"]);

function maskSensitiveFieldsForLog(value: unknown, seen: WeakSet<object> = new WeakSet()): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => maskSensitiveFieldsForLog(item, seen));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return "[Circular]";
  }
  seen.add(value);

  const record = value as Record<string, unknown>;
  const masked: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(record)) {
    masked[key] =
      SENSITIVE_LOG_KEYS.has(key) && typeof entry === "string"
        ? "***"
        : maskSensitiveFieldsForLog(entry, seen);
  }
  return masked;
}

async function readRequestBodyForLog(request: Request): Promise<unknown> {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }

  try {
    const text = await request.clone().text();
    if (!text) {
      return undefined;
    }

    try {
      return maskSensitiveFieldsForLog(JSON.parse(text));
    } catch {
      return text;
    }
  } catch {
    return undefined;
  }
}

async function readResponseBodyForLog(response: Response): Promise<unknown> {
  try {
    const text = await response.clone().text();
    if (!text) {
      return "(empty)";
    }

    try {
      return maskSensitiveFieldsForLog(JSON.parse(text));
    } catch {
      return text;
    }
  } catch {
    return "(unreadable)";
  }
}

function getErrorRequest(error: unknown): Request | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const request = (error as KyRequestError).request;
  return request instanceof Request ? request : undefined;
}

function formatApiErrorForLog(error: unknown): string {
  const request = getErrorRequest(error);
  const requestLabel = request ? `${request.method} ${request.url}` : "unknown request";

  if (error instanceof HTTPError) {
    return `${error.response.status} ${requestLabel}`;
  }

  if (error instanceof TimeoutError) {
    return `timeout · ${requestLabel}`;
  }

  if (error instanceof Error) {
    const detail = error.message || error.name || "Unknown error";
    return `${detail} · ${requestLabel}`;
  }

  return `${String(error)} · ${requestLabel}`;
}

function logApiDev(message: string, ...details: unknown[]): void {
  if (!__DEV__) {
    return;
  }
  console.log(message, ...details);
}

function isSafeUrlSegment(segment: string): boolean {
  return segment === "" || /^[a-z-]+$/.test(segment) || /^v\d+$/.test(segment);
}

// URL path 파라미터(초대 토큰 등)와 query string(검색어 등)이 그대로 노출되지 않도록,
// 알려진 정적 라우트 세그먼트만 남기고 나머지는 redact한다. query string은 통째로 제거한다.
// Sentry의 자동 breadcrumb(app/_layout.tsx의 beforeBreadcrumb)에도 재사용하므로 export한다.
export function sanitizeUrlForLog(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const sanitizedPath = url.pathname
      .split("/")
      .map((segment) => (isSafeUrlSegment(segment) ? segment : "[redacted]"))
      .join("/");
    return `${url.origin}${sanitizedPath}`;
  } catch {
    return "[invalid-url]";
  }
}

function captureServerError(error: HTTPError): void {
  const method = error.request.method;
  const url = sanitizeUrlForLog(error.request.url);
  const status = error.response.status;

  // ky HTTPError.message에는 원본 URL 전체가 포함돼 있어(https://github.com/sindresorhus/ky),
  // 그대로 캡처하면 redact가 무의미해진다. 정제된 정보만 담은 새 Error를 캡처한다.
  const sanitizedError = new Error(`HTTP ${status} ${method} ${url}`);
  sanitizedError.name = "HTTPError";

  Sentry.captureException(sanitizedError, {
    tags: { http_status: String(status) },
    extra: { method, url },
    fingerprint: ["api-5xx", method, url, String(status)],
  });
}

/**
 * 앱 전역에서 사용하는 ky 인스턴스.
 * mock 모드일 때는 등록된 핸들러만 응답합니다 (`/api/mock/handlers.ts`에서 등록).
 */
const baseUrl = apiConfig.baseUrl.endsWith("/") ? apiConfig.baseUrl : `${apiConfig.baseUrl}/`;

export const api: KyInstance = ky.create({
  baseUrl,
  timeout: apiConfig.timeoutMs,
  fetch: fetchImpl,
  hooks: {
    beforeRequest: [
      async ({ request }) => {
        if (!request.headers.has("Authorization")) {
          const token = useSessionStore.getState().accessToken;
          if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
          }
        }

        const requestBody = await readRequestBodyForLog(request);
        if (requestBody !== undefined) {
          logApiDev(`[api] → ${request.method} ${request.url}`, requestBody);
        } else {
          logApiDev(`[api] → ${request.method} ${request.url}`);
        }
      },
    ],
    afterResponse: [
      async ({ request, response }) => {
        if (!__DEV__ || !response.ok) {
          return response;
        }

        const body = await readResponseBodyForLog(response);
        logApiDev(`[api] ← ${response.status} ${request.method} ${request.url}`, body);
        return response;
      },
      async ({ request, response, retryCount }) => {
        const isReissueRequest = request.url.endsWith(apiPaths.authReissue);
        if (response.status !== 401 || retryCount > 0 || isReissueRequest) {
          return;
        }

        const newAccessToken = await refreshAccessToken();
        if (!newAccessToken) {
          return;
        }

        request.headers.set("Authorization", `Bearer ${newAccessToken}`);
        return ky.retry();
      },
    ],
    beforeError: [
      async ({ error }) => {
        if (error instanceof HTTPError && error.response.status >= 500) {
          captureServerError(error);
        }

        if (!__DEV__) {
          return error;
        }

        const label = formatApiErrorForLog(error);

        if (error instanceof HTTPError) {
          const body = await readResponseBodyForLog(error.response);
          logApiDev(`[api] ✕ ${label}`, body);
        } else {
          const cause =
            error instanceof Error && "cause" in error
              ? (error as Error & { cause?: unknown }).cause
              : undefined;
          if (cause !== undefined) {
            logApiDev(`[api] ✕ ${label}`, maskSensitiveFieldsForLog(cause));
          } else {
            logApiDev(`[api] ✕ ${label}`);
          }
        }

        return error;
      },
    ],
  },
});
