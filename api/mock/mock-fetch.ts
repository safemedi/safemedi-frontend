import { Platform } from "react-native";

import { createXhrFetch } from "@/api/xhr-fetch";
import { apiConfig } from "@/constants/api-config";
import type { MockRegistry } from "./registry";
import { pathRelativeToApiBase } from "./resolve-path";
import type { HttpMethod } from "./types";

function toMethod(method: string | undefined): HttpMethod {
  const m = (method ?? "GET").toUpperCase();
  if (m === "GET" || m === "POST" || m === "PUT" || m === "PATCH" || m === "DELETE") {
    return m;
  }
  return "GET";
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function readJsonBody(input: RequestInfo | URL, init?: RequestInit): Promise<unknown> {
  try {
    const request = new Request(input, init);
    const text = await request.text();
    if (!text) return undefined;
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * mock 모드에서만 사용. 등록된 경로가 없으면 404 Response를 반환합니다.
 */
export function createMockFetch(registry: MockRegistry): typeof fetch {
  return async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = toMethod(init?.method ?? (input instanceof Request ? input.method : undefined));
    const { pathname, searchParams } = pathRelativeToApiBase(url);

    const route = registry.find(method, pathname);
    if (!route) {
      return new Response(
        JSON.stringify({
          error: "mock_not_found",
          message: `No mock for ${method} ${pathname}`,
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    if (route.delayMs) await delay(route.delayMs);

    const jsonBody = method !== "GET" ? await readJsonBody(input, init) : undefined;

    const result = await route.handler({ method, path: pathname, searchParams, jsonBody });
    if (result instanceof Response) {
      return result;
    }

    const status = route.status ?? 200;

    return new Response(JSON.stringify(result), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  };
}

function resolveNativeFetch(): typeof fetch {
  if (apiConfig.useXhrFetch && Platform.OS !== "web") {
    return createXhrFetch();
  }
  return globalThis.fetch.bind(globalThis);
}

export function resolveFetchImplementation(registry: MockRegistry): typeof fetch {
  if (apiConfig.useMock) {
    return createMockFetch(registry);
  }
  return resolveNativeFetch();
}
