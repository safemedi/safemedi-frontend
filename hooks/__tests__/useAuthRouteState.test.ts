import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useAuthRouteState } from "@/hooks/useAuthRouteState";
import type { User } from "@/stores/userStore";

const mockRemoveQueries = jest.fn();
const mockClearSession = jest.fn();
const mockSetTutorialCompleted = jest.fn();
const mockSetUser = jest.fn();
const mockRefetch = jest.fn();

let mockHydrated = true;
let mockUnauthorized = false;
let mockAccessToken: string | null = "token";
let mockIsTutorialCompleted = false;
let mockUser: User | null = null;
let mockProfile: { isTutorialCompleted: boolean } | null = null;
let mockIsPending = false;
let mockIsError = false;
let mockError: Error | null = null;

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    removeQueries: mockRemoveQueries,
  }),
}));

jest.mock("@/hooks/useSessionHydrated", () => ({
  useSessionHydrated: () => mockHydrated,
}));

jest.mock("@/api/error", () => ({
  isUnauthorizedError: () => mockUnauthorized,
}));

jest.mock("@/api/queries/user", () => ({
  useUserProfile: () => ({
    data: mockProfile,
    isPending: mockIsPending,
    isError: mockIsError,
    error: mockError,
    refetch: mockRefetch,
  }),
}));

jest.mock("@/stores/sessionStore", () => ({
  useSessionStore: (
    selector: (state: {
      accessToken: string | null;
      isTutorialCompleted: boolean;
      clearSession: () => void;
      setTutorialCompleted: (value: boolean) => void;
    }) => unknown,
  ) =>
    selector({
      accessToken: mockAccessToken,
      isTutorialCompleted: mockIsTutorialCompleted,
      clearSession: mockClearSession,
      setTutorialCompleted: mockSetTutorialCompleted,
    }),
}));

jest.mock("@/stores/userStore", () => ({
  useUserStore: (
    selector: (state: { user: User | null; setUser: (value: User | null) => void }) => unknown,
  ) =>
    selector({
      user: mockUser,
      setUser: mockSetUser,
    }),
}));

const mockLogout = jest.fn();

jest.mock("@/hooks/useLogout", () => ({
  useLogout: () => mockLogout,
}));

jest.mock("@/utils/user-mapper", () => ({
  profileToUser: () =>
    ({
      id: "me",
      displayName: "유저",
      email: null,
      birthDate: null,
      height: null,
      weight: null,
      gender: null,
      bloodType: null,
      allergies: [],
      chronicConditions: [],
      isTutorial: false,
    }) satisfies User,
}));

function resetMocks() {
  mockHydrated = true;
  mockUnauthorized = false;
  mockAccessToken = "token";
  mockIsTutorialCompleted = false;
  mockUser = null;
  mockProfile = { isTutorialCompleted: false };
  mockIsPending = false;
  mockIsError = false;
  mockError = null;
  jest.clearAllMocks();
}

describe("useAuthRouteState", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("hydration 이전에는 loading 상태를 반환한다", () => {
    mockHydrated = false;

    const { result } = renderHook(() => useAuthRouteState());

    expect(result.current).toEqual({ kind: "loading" });
  });

  it("토큰이 없으면 로그인으로 리다이렉트한다", () => {
    mockAccessToken = null;

    const { result } = renderHook(() => useAuthRouteState());

    expect(result.current).toEqual({ kind: "redirect", href: "/(auth)/login" });
  });

  it("비인가(401) 오류면 공통 로그아웃 처리 후 loading 상태를 유지한다", async () => {
    mockIsError = true;
    mockUnauthorized = true;
    mockError = new Error("401");

    const { result } = renderHook(() => useAuthRouteState());

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledWith();
    });
    expect(mockClearSession).not.toHaveBeenCalled();
    expect(mockRemoveQueries).not.toHaveBeenCalled();
    expect(result.current).toEqual({ kind: "loading" });
  });

  it("일반 오류면 error 상태와 retry 핸들러를 제공한다", async () => {
    mockIsError = true;
    mockUnauthorized = false;
    mockError = new Error("500");

    const { result } = renderHook(() => useAuthRouteState());

    const errorState = result.current;
    expect(errorState.kind).toBe("error");
    if (errorState.kind !== "error") {
      throw new Error("error 상태가 아닙니다.");
    }

    await act(async () => {
      errorState.retry();
    });

    expect(mockRefetch).toHaveBeenCalledTimes(1);
    expect(errorState.logout).toBe(mockLogout);
  });

  it("프로필이 있고 튜토리얼 미완료면 튜토리얼로 리다이렉트한다", async () => {
    mockProfile = { isTutorialCompleted: false };
    mockIsTutorialCompleted = false;

    const { result } = renderHook(() => useAuthRouteState());

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledTimes(1);
    });
    expect(result.current).toEqual({ kind: "redirect", href: "/(auth)/tutorial" });
  });

  it("튜토리얼 완료 상태면 대시보드로 리다이렉트한다", () => {
    mockProfile = { isTutorialCompleted: true };

    const { result } = renderHook(() => useAuthRouteState());

    expect(mockSetTutorialCompleted).toHaveBeenCalledWith(true);
    expect(result.current).toEqual({ kind: "redirect", href: "/(tabs)/dashboard" });
  });
});
