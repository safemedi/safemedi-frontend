const mockPostReissueToken = jest.fn<Promise<unknown>, [string]>();
const mockSetAccessToken = jest.fn();
const mockSetRefreshToken = jest.fn();

let mockRefreshToken: string | null = "old-refresh-token";

jest.mock("ky", () => ({
  __esModule: true,
  isHTTPError: (error: unknown): boolean =>
    typeof error === "object" && error !== null && "response" in error,
}));

jest.mock("@/api/endpoints/auth", () => ({
  postReissueToken: (refreshToken: string) => mockPostReissueToken(refreshToken),
}));

function httpError(status: number): { response: { status: number } } {
  return { response: { status } };
}

jest.mock("@/stores/sessionStore", () => ({
  useSessionStore: {
    getState: () => ({
      refreshToken: mockRefreshToken,
      setAccessToken: mockSetAccessToken,
      setRefreshToken: mockSetRefreshToken,
    }),
  },
}));

function loadTokenRefresh(): { refreshAccessToken: () => Promise<string | null> } {
  let moduleExports: { refreshAccessToken: () => Promise<string | null> } | undefined;
  jest.isolateModules(() => {
    moduleExports = require("../token-refresh");
  });
  if (!moduleExports) {
    throw new Error("token-refresh 모듈을 불러오지 못했습니다.");
  }
  return moduleExports;
}

describe("api/token-refresh", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefreshToken = "old-refresh-token";
  });

  it("refreshToken으로 재발급에 성공하면 세션을 갱신하고 새 accessToken을 반환한다", async () => {
    mockPostReissueToken.mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    });
    const { refreshAccessToken } = loadTokenRefresh();

    const result = await refreshAccessToken();

    expect(mockPostReissueToken).toHaveBeenCalledWith("old-refresh-token");
    expect(mockSetAccessToken).toHaveBeenCalledWith("new-access-token");
    expect(mockSetRefreshToken).toHaveBeenCalledWith("new-refresh-token");
    expect(result).toBe("new-access-token");
  });

  it("refreshToken이 없으면 재발급 API를 호출하지 않고 null을 반환한다", async () => {
    mockRefreshToken = null;
    const { refreshAccessToken } = loadTokenRefresh();

    const result = await refreshAccessToken();

    expect(mockPostReissueToken).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it("재발급 API가 401(refreshToken 거부)로 실패하면 null을 반환하고 세션을 갱신하지 않는다", async () => {
    mockPostReissueToken.mockRejectedValue(httpError(401));
    const { refreshAccessToken } = loadTokenRefresh();

    const result = await refreshAccessToken();

    expect(result).toBeNull();
    expect(mockSetAccessToken).not.toHaveBeenCalled();
    expect(mockSetRefreshToken).not.toHaveBeenCalled();
  });

  it("재발급 API가 네트워크 오류로 실패하면 세션을 정리하지 않고 오류를 그대로 던진다", async () => {
    const networkError = new Error("network down");
    mockPostReissueToken.mockRejectedValue(networkError);
    const { refreshAccessToken } = loadTokenRefresh();

    await expect(refreshAccessToken()).rejects.toBe(networkError);
    expect(mockSetAccessToken).not.toHaveBeenCalled();
    expect(mockSetRefreshToken).not.toHaveBeenCalled();
  });

  it("재발급 API가 5xx로 실패하면 세션을 정리하지 않고 오류를 그대로 던진다", async () => {
    mockPostReissueToken.mockRejectedValue(httpError(500));
    const { refreshAccessToken } = loadTokenRefresh();

    await expect(refreshAccessToken()).rejects.toEqual(httpError(500));
    expect(mockSetAccessToken).not.toHaveBeenCalled();
    expect(mockSetRefreshToken).not.toHaveBeenCalled();
  });

  it("응답을 기다리는 동안 세션의 refreshToken이 바뀌면 응답을 버리고 세션을 갱신하지 않는다", async () => {
    let resolvePromise: (value: { accessToken: string; refreshToken: string }) => void = () => {};
    mockPostReissueToken.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );
    const { refreshAccessToken } = loadTokenRefresh();

    const resultPromise = refreshAccessToken();
    mockRefreshToken = "changed-during-request";
    resolvePromise({ accessToken: "new-access-token", refreshToken: "new-refresh-token" });
    const result = await resultPromise;

    expect(result).toBeNull();
    expect(mockSetAccessToken).not.toHaveBeenCalled();
    expect(mockSetRefreshToken).not.toHaveBeenCalled();
  });

  it("동시에 여러 번 호출되어도 재발급 API는 한 번만 호출된다(single-flight)", async () => {
    let resolvePromise: (value: { accessToken: string; refreshToken: string }) => void = () => {};
    mockPostReissueToken.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );
    const { refreshAccessToken } = loadTokenRefresh();

    const first = refreshAccessToken();
    const second = refreshAccessToken();

    resolvePromise({ accessToken: "new-access-token", refreshToken: "new-refresh-token" });
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(mockPostReissueToken).toHaveBeenCalledTimes(1);
    expect(firstResult).toBe("new-access-token");
    expect(secondResult).toBe("new-access-token");
  });
});
