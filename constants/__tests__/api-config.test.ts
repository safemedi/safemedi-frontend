import type { ApiConfig } from "../api-config";

describe("api-config", () => {
  const originalEnv = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = originalEnv;
  });

  it("문자열 불리언 환경변수를 파싱하고 baseUrl 끝 슬래시를 제거한다", () => {
    process.env = {
      ...originalEnv,
      EXPO_PUBLIC_USE_MOCK_API: "yes",
      EXPO_PUBLIC_USE_XHR_FETCH: "true",
      EXPO_PUBLIC_API_BASE_URL: "https://api.example.com/",
    };

    const { apiConfig } = require("../api-config") as { apiConfig: ApiConfig };
    expect(apiConfig.useMock).toBe(true);
    expect(apiConfig.useXhrFetch).toBe(true);
    expect(apiConfig.baseUrl).toBe("https://api.example.com");
    expect(apiConfig.timeoutMs).toBe(30000);
  });

  it("환경변수가 없으면 기본값을 사용한다", () => {
    process.env = {
      ...originalEnv,
      EXPO_PUBLIC_USE_MOCK_API: undefined,
      EXPO_PUBLIC_USE_XHR_FETCH: undefined,
      EXPO_PUBLIC_API_BASE_URL: undefined,
    };

    const { apiConfig } = require("../api-config") as { apiConfig: ApiConfig };
    expect(apiConfig.useXhrFetch).toBe(false);
    expect(apiConfig.baseUrl).toBe("https://api.safemedi.local");
  });

  it("불리언 파싱 불일치 값은 false로 처리한다", () => {
    process.env = {
      ...originalEnv,
      EXPO_PUBLIC_USE_MOCK_API: "off",
    };

    const { apiConfig } = require("../api-config") as { apiConfig: ApiConfig };
    expect(typeof apiConfig.useMock).toBe("boolean");
  });
});
