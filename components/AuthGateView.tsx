import { Pressable, View } from "react-native";
import { Text } from "tamagui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { palette } from "@/constants/design-tokens";

type AuthGateViewProps = {
  kind: "loading" | "error";
  onRetry?: () => void;
  onLogout?: () => void;
};

export function AuthGateView({ kind, onRetry, onLogout }: AuthGateViewProps) {
  if (kind === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner accessibilityLabel="사용자 정보 로딩 중" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Text color={palette.text}>사용자 정보를 불러오지 못했습니다.</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="사용자 정보 다시 시도"
          style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1 }}
        >
          <Text color={palette.text}>다시 시도</Text>
        </Pressable>
        <Pressable
          onPress={onLogout}
          accessibilityRole="button"
          accessibilityLabel="로그아웃"
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: palette.red_soft,
          }}
        >
          <Text color={palette.red_strong}>로그아웃</Text>
        </Pressable>
      </View>
    </View>
  );
}
