import { StyleSheet, Text, View } from "react-native";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { palette } from "@/constants/design-tokens";

export interface ScreenLoadingViewProps {
  readonly accessibilityLabel?: string;
  readonly message?: string;
}

/** ScrollView 외부의 화면 루트에서 사용해 뷰포트 중앙에 초기 로딩을 표시합니다. */
export function ScreenLoadingView({
  accessibilityLabel = "화면 로딩 중",
  message,
}: ScreenLoadingViewProps) {
  return (
    <View style={styles.container} accessibilityState={{ busy: true }}>
      <LoadingSpinner accessibilityLabel={accessibilityLabel} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 10 },
  message: { color: palette.icon, fontSize: 14, lineHeight: 20, textAlign: "center" },
});
