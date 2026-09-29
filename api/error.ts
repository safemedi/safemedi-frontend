import { isHTTPError } from "ky";

export type ApiErrorCodePrefix =
  | "AUTH"
  | "FAMILY"
  | "MEDICATION"
  | "NOTIFICATION"
  | "PRESCRIPTION"
  | "SYS"
  | "TOKEN"
  | "USER"
  | "VAL";

export type ApiErrorCode = `${ApiErrorCodePrefix}_${string}` | (string & {});

export interface ApiErrorResponseBody {
  readonly code?: ApiErrorCode;
  readonly message?: string;
}

export type ApiErrorInfo = {
  status?: number;
  code?: ApiErrorCode;
  message: string;
};

const FALLBACK_MESSAGE = "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

function toErrorResponseBody(value: unknown): ApiErrorResponseBody {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  return {
    code: typeof record.code === "string" ? record.code : undefined,
    message: typeof record.message === "string" ? record.message : undefined,
  };
}

export function getHttpStatus(error: unknown): number | undefined {
  if (!isHTTPError(error)) return undefined;
  return error.response.status;
}

export function isUnauthorizedError(error: unknown): boolean {
  return getHttpStatus(error) === 401;
}

export async function parseApiError(
  error: unknown,
  fallbackMessage?: string,
): Promise<ApiErrorInfo> {
  if (!isHTTPError(error)) {
    return { message: fallbackMessage ?? FALLBACK_MESSAGE };
  }

  const status = error.response.status;
  let code: ApiErrorCode | undefined;
  let message: string | undefined;

  try {
    const body = toErrorResponseBody(await error.response.clone().json());
    code = body.code;
    message = body.message;
  } catch {
    // 응답이 JSON이 아니거나 body를 파싱할 수 없는 경우 기본 메시지를 사용합니다.
  }

  if (!message) {
    message = fallbackMessage ?? FALLBACK_MESSAGE;
  }

  return { status, code, message };
}

export async function getApiErrorMessage(error: unknown, fallbackMessage: string): Promise<string> {
  const parsedError = await parseApiError(error, fallbackMessage);
  return parsedError.message;
}
