describe("resolveFetchImplementation", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    globalThis.fetch = jest.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function loadResolver(options: { useMock?: boolean; useXhrFetch?: boolean; platform?: string }) {
    const xhrFetch = jest.fn() as unknown as typeof fetch;
    const createXhrFetch = jest.fn(() => xhrFetch);

    jest.doMock("react-native", () => ({
      Platform: { OS: options.platform ?? "ios" },
    }));
    jest.doMock("@/api/xhr-fetch", () => ({ createXhrFetch }));
    jest.doMock("@/constants/api-config", () => ({
      apiConfig: {
        baseUrl: "https://api.example.com",
        timeoutMs: 30000,
        useMock: options.useMock ?? false,
        useXhrFetch: options.useXhrFetch ?? false,
      },
    }));

    const module = require("../mock-fetch") as typeof import("../mock-fetch");
    return {
      createXhrFetch,
      resolveFetchImplementation: module.resolveFetchImplementation,
      xhrFetch,
    };
  }

  it("실 API 요청은 기본적으로 global fetch를 사용한다", () => {
    const { createXhrFetch, resolveFetchImplementation } = loadResolver({ platform: "ios" });

    const fetchImpl = resolveFetchImplementation({} as never);
    fetchImpl("https://api.example.com/test");

    expect(globalThis.fetch).toHaveBeenCalledWith("https://api.example.com/test");
    expect(createXhrFetch).not.toHaveBeenCalled();
  });

  it("네이티브에서 XHR opt-in이 켜진 경우에만 XHR fetch를 사용한다", () => {
    const { createXhrFetch, resolveFetchImplementation, xhrFetch } = loadResolver({
      platform: "android",
      useXhrFetch: true,
    });

    const fetchImpl = resolveFetchImplementation({} as never);

    expect(fetchImpl).toBe(xhrFetch);
    expect(createXhrFetch).toHaveBeenCalledTimes(1);
  });

  it("web에서는 XHR opt-in이 켜져도 global fetch를 유지한다", () => {
    const { createXhrFetch, resolveFetchImplementation } = loadResolver({
      platform: "web",
      useXhrFetch: true,
    });

    const fetchImpl = resolveFetchImplementation({} as never);
    fetchImpl("https://api.example.com/test");

    expect(globalThis.fetch).toHaveBeenCalledWith("https://api.example.com/test");
    expect(createXhrFetch).not.toHaveBeenCalled();
  });
});
