import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * 탭바 없는 화면(모달·상세 push 화면)의 스크롤 콘텐츠 하단 여백을 계산한다.
 * 탭 네비게이터 하위 화면은 탭바가 이미 insets.bottom을 확보하므로 이 훅 대신
 * `layout.tabScreenBottomSpacing`을 직접 사용한다.
 */
export function useScreenBottomPadding(extra: number): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + extra;
}
