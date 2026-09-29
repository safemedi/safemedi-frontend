import { useSessionStore } from "@/stores/sessionStore";

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

describe("useSessionStore", () => {
  beforeEach(() => {
    useSessionStore.setState({
      accessToken: null,
      refreshToken: null,
      isTutorialCompleted: false,
    });
  });

  it("초기 상태를 기본값으로 가진다", () => {
    const state = useSessionStore.getState();

    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isTutorialCompleted).toBe(false);
  });

  it("setAccessToken이 accessToken을 갱신한다", () => {
    useSessionStore.getState().setAccessToken("token-123");

    expect(useSessionStore.getState().accessToken).toBe("token-123");
  });

  it("setRefreshToken이 refreshToken을 갱신한다", () => {
    useSessionStore.getState().setRefreshToken("refresh-token-123");

    expect(useSessionStore.getState().refreshToken).toBe("refresh-token-123");
  });

  it("setTutorialCompleted가 isTutorialCompleted를 갱신한다", () => {
    useSessionStore.getState().setTutorialCompleted(true);

    expect(useSessionStore.getState().isTutorialCompleted).toBe(true);
  });

  it("clearSession이 세션 상태를 초기화한다", () => {
    useSessionStore.setState({
      accessToken: "token-123",
      refreshToken: "refresh-token-123",
      isTutorialCompleted: true,
    });

    useSessionStore.getState().clearSession();

    const state = useSessionStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isTutorialCompleted).toBe(false);
  });

  it("partialize가 저장 대상 필드만 반환한다", () => {
    const partialize = useSessionStore.persist.getOptions().partialize;
    expect(partialize).toBeDefined();

    const partialized = partialize?.({
      accessToken: "token-123",
      refreshToken: "refresh-token-123",
      isTutorialCompleted: true,
      setAccessToken: () => undefined,
      setRefreshToken: () => undefined,
      setTutorialCompleted: () => undefined,
      clearSession: () => undefined,
    });

    expect(partialized).toEqual({
      accessToken: "token-123",
      refreshToken: "refresh-token-123",
      isTutorialCompleted: true,
    });
  });
});
