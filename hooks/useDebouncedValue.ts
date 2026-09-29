import { useEffect, useState } from "react";

/**
 * 값 변경 후 지정한 지연이 지나면 최신 값을 반환한다.
 * 입력 즉시 검색 같은 고빈도 트리거를 눌러서 완화할 때 사용한다.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
