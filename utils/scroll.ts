import type { NativeScrollEvent } from "react-native";

const DEFAULT_END_THRESHOLD_PX = 48;

/**
 * 세로 스크롤이 바닥 근처에 도달했는지 판단한다.
 * 바깥 ScrollView 안에서 무한 로드를 구현할 때 VirtualizedList 중첩 없이 사용한다.
 */
export function isCloseToScrollEnd(
  event: NativeScrollEvent,
  thresholdPx: number = DEFAULT_END_THRESHOLD_PX,
): boolean {
  const { layoutMeasurement, contentOffset, contentSize } = event;
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - thresholdPx;
}
