import type { HttpMethod, MockHandler, MockRoute } from "./types";

function normalizePath(path: string): string {
  if (!path.startsWith("/")) return `/${path}`;
  return path.replace(/\/+$/, "") || "/";
}

/**
 * method + path 로 mock 응답을 등록합니다.
 * 동적 경로는 `registerMatch`로 순서를 지정해 주세요(구체적인 경로를 먼저).
 */
export class MockRegistry {
  private readonly routes: MockRoute[] = [];

  register<T>(
    method: HttpMethod,
    path: string,
    handler: MockHandler<T>,
    options?: { delayMs?: number; status?: number },
  ): void {
    const normalized = normalizePath(path);
    this.routes.push({
      label: `${method} ${normalized}`,
      match: (m, p) => m === method && normalizePath(p) === normalized,
      handler: handler as MockHandler,
      delayMs: options?.delayMs,
      status: options?.status ?? 200,
    });
  }

  registerMatch<T>(
    method: HttpMethod,
    test: (pathname: string) => boolean,
    handler: MockHandler<T>,
    options?: { delayMs?: number; status?: number; label?: string },
  ): void {
    this.routes.push({
      label: options?.label ?? `${method} <match>`,
      match: (m, p) => m === method && test(normalizePath(p)),
      handler: handler as MockHandler,
      delayMs: options?.delayMs,
      status: options?.status ?? 200,
    });
  }

  find(method: HttpMethod, pathname: string): MockRoute | undefined {
    const p = normalizePath(pathname);
    for (const route of this.routes) {
      if (route.match(method, p)) return route;
    }
    return undefined;
  }

  list(): MockRoute[] {
    return [...this.routes];
  }
}
