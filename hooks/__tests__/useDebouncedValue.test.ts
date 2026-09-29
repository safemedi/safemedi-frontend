import { act, renderHook } from "@testing-library/react-native";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("초기값을 즉시 반환한다", () => {
    const { result } = renderHook(() => useDebouncedValue("초기", 250));
    expect(result.current).toBe("초기");
  });

  it("지연 시간이 지난 후에 최신 값을 반영한다", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 250),
      { initialProps: { value: "a" } },
    );

    rerender({ value: "ab" });
    expect(result.current).toBe("a");

    act(() => jest.advanceTimersByTime(250));
    expect(result.current).toBe("ab");
  });

  it("지연 시간 내 연속 변경은 마지막 값만 반영한다", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 250),
      { initialProps: { value: "a" } },
    );

    rerender({ value: "ab" });
    act(() => jest.advanceTimersByTime(100));
    rerender({ value: "abc" });
    act(() => jest.advanceTimersByTime(100));
    expect(result.current).toBe("a");

    act(() => jest.advanceTimersByTime(150));
    expect(result.current).toBe("abc");
  });
});
