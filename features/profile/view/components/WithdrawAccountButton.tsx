import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text } from "react-native";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { palette } from "@/constants/design-tokens";

export type WithdrawAccountButtonProps = {
  onPress?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
};

export function WithdrawAccountButton({
  onPress,
  disabled = false,
  isLoading = false,
}: WithdrawAccountButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
      testID="withdraw-account-button"
      accessibilityLabel="회원 탈퇴"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
    >
      {isLoading ? (
        <LoadingSpinner size="small" accessibilityLabel="회원 탈퇴 처리 중" />
      ) : (
        <Ionicons name="person-remove-outline" size={16} color={palette.red_deep} />
      )}
      <Text style={styles.label}>{isLoading ? "탈퇴 처리 중..." : "회원 탈퇴"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: palette.warning_allergy_bg,
    borderColor: palette.red_medium,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: palette.red_deep,
  },
});
