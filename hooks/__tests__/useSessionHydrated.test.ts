import { act, renderHook } from "@testing-library/react-native";
import { useSessionHydrated } from "@/hooks/useSessionHydrated";

let mockHydrated = false;
let mockCallback: null | (() => void) = null;

jest.mock("@/stores/sessionStore", () => ({
  useSessionStore: {
    persist: {
      hasHydrated: () => mockHydrated,
      onFinishHydration: (callback: () => void) => {
        mockCallback = callback;
        return jest.fn();
      },
    },
  },
}));

describe("useSessionHydrated", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHydrated = false;
    mockCallback = null;
  });

  it("초기 hydration이 안 된 경우 false를 반환한다", () => {
    const { result } = renderHook(() => useSessionHydrated());
    expect(result.current).toBe(false);
  });

  it("이미 hydration이 끝난 경우 true를 반환한다", () => {
    mockHydrated = true;
    const { result } = renderHook(() => useSessionHydrated());
    expect(result.current).toBe(true);
  });

  it("onFinishHydration 콜백 실행 시 true로 전환된다", () => {
    const { result } = renderHook(() => useSessionHydrated());
    expect(result.current).toBe(false);

    act(() => {
      mockCallback?.();
    });
    expect(result.current).toBe(true);
  });
});
