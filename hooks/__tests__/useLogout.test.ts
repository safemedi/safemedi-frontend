import { act, renderHook } from "@testing-library/react-native";
import { useLogout } from "@/hooks/useLogout";

const mockRemoveQueries = jest.fn();
const mockClearSession = jest.fn();
const mockClearUser = jest.fn();
const mockClearRegisteredDeviceToken = jest.fn();
const mockLogoutMutateAsync = jest.fn();

let mockRegisteredDeviceToken: string | null = "mock-device-token";

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    removeQueries: mockRemoveQueries,
  }),
}));

jest.mock("@/api/queries/auth", () => ({
  useLogoutMutation: () => ({
    mutateAsync: mockLogoutMutateAsync,
  }),
}));

jest.mock("@/hooks/pushNotificationTokenStore", () => ({
  getRegisteredDeviceToken: () => mockRegisteredDeviceToken,
  clearRegisteredDeviceToken: (...args: unknown[]) => mockClearRegisteredDeviceToken(...args),
}));

jest.mock("@/stores/sessionStore", () => ({
  useSessionStore: (selector: (state: { clearSession: () => void }) => unknown) =>
    selector({ clearSession: mockClearSession }),
}));

jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: { clearUser: () => void }) => unknown) =>
    selector({ clearUser: mockClearUser }),
}));

describe("useLogout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRegisteredDeviceToken = "mock-device-token";
    mockLogoutMutateAsync.mockResolvedValue({ message: "ok" });
  });

  it("로그아웃 API 호출 후 세션, 사용자, 인증 스코프 query cache를 정리한다", async () => {
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current();
    });

    expect(mockLogoutMutateAsync).toHaveBeenCalledWith({ deviceToken: "mock-device-token" });
    expect(mockClearRegisteredDeviceToken).toHaveBeenCalledTimes(1);
    expect(mockClearSession).toHaveBeenCalledTimes(1);
    expect(mockClearUser).toHaveBeenCalledTimes(1);
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ["user", "me"] });
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ["family"] });
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ["profile"] });
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ["prescriptions"] });
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ["scan"] });
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ["map"] });
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ["notification"] });
    expect(mockRemoveQueries).toHaveBeenCalledTimes(8);
  });

  it("로그아웃 API 응답 전에는 로컬 상태를 정리하지 않는다", async () => {
    let resolveLogout: (value: { message: string }) => void = () => {};
    mockLogoutMutateAsync.mockReturnValue(
      new Promise((resolve) => {
        resolveLogout = resolve;
      }),
    );
    const { result } = renderHook(() => useLogout());

    const logoutPromise = result.current();
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockLogoutMutateAsync).toHaveBeenCalledWith({ deviceToken: "mock-device-token" });
    expect(mockClearRegisteredDeviceToken).not.toHaveBeenCalled();
    expect(mockClearSession).not.toHaveBeenCalled();
    expect(mockClearUser).not.toHaveBeenCalled();
    expect(mockRemoveQueries).not.toHaveBeenCalled();

    await act(async () => {
      resolveLogout({ message: "ok" });
      await logoutPromise;
    });

    expect(mockClearRegisteredDeviceToken).toHaveBeenCalledTimes(1);
    expect(mockClearSession).toHaveBeenCalledTimes(1);
    expect(mockClearUser).toHaveBeenCalledTimes(1);
    expect(mockRemoveQueries).toHaveBeenCalledTimes(8);
  });

  it("로그아웃 처리 중 중복 호출되면 추가 API 호출을 막는다", async () => {
    let resolveLogout: (value: { message: string }) => void = () => {};
    mockLogoutMutateAsync.mockReturnValue(
      new Promise((resolve) => {
        resolveLogout = resolve;
      }),
    );
    const { result } = renderHook(() => useLogout());

    const firstLogoutPromise = result.current();
    const secondLogoutPromise = result.current();
    await act(async () => {
      await secondLogoutPromise;
    });

    expect(mockLogoutMutateAsync).toHaveBeenCalledTimes(1);
    expect(mockClearSession).not.toHaveBeenCalled();

    await act(async () => {
      resolveLogout({ message: "ok" });
      await firstLogoutPromise;
    });

    expect(mockClearSession).toHaveBeenCalledTimes(1);
  });

  it("등록된 디바이스 토큰이 없으면 로그아웃 API를 건너뛰고 로컬 상태만 정리한다", async () => {
    mockRegisteredDeviceToken = null;
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current();
    });

    expect(mockLogoutMutateAsync).not.toHaveBeenCalled();
    expect(mockClearRegisteredDeviceToken).not.toHaveBeenCalled();
    expect(mockClearSession).toHaveBeenCalledTimes(1);
    expect(mockClearUser).toHaveBeenCalledTimes(1);
    expect(mockRemoveQueries).toHaveBeenCalledTimes(8);
  });

  it("로그아웃 API가 실패해도 로컬 로그아웃은 완료한다", async () => {
    mockLogoutMutateAsync.mockRejectedValue(new Error("network"));
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current();
    });

    expect(mockClearRegisteredDeviceToken).not.toHaveBeenCalled();
    expect(mockClearSession).toHaveBeenCalledTimes(1);
    expect(mockClearUser).toHaveBeenCalledTimes(1);
    expect(mockRemoveQueries).toHaveBeenCalledTimes(8);
    warnSpy.mockRestore();
  });
});
