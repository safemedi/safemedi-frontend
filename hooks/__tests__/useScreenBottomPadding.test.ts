import { renderHook } from "@testing-library/react-native";
import { useScreenBottomPadding } from "@/hooks/useScreenBottomPadding";

let mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => mockInsets,
}));

describe("useScreenBottomPadding", () => {
  beforeEach(() => {
    mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
  });

  it("시스템 하단 인셋에 추가 여백을 더해 반환한다", () => {
    mockInsets = { top: 0, bottom: 34, left: 0, right: 0 };
    const { result } = renderHook(() => useScreenBottomPadding(24));
    expect(result.current).toBe(58);
  });

  it("하단 인셋이 없으면 추가 여백만 반환한다", () => {
    const { result } = renderHook(() => useScreenBottomPadding(24));
    expect(result.current).toBe(24);
  });
});
