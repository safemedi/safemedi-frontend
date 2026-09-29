import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text } from "react-native";

import { palette } from "@/constants/design-tokens";

export type LogoutButtonProps = {
  onPress?: () => void;
  disabled?: boolean;
};

export function LogoutButton({ onPress, disabled = false }: LogoutButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
      testID="logout-button"
      accessibilityState={{ disabled }}
    >
      <Ionicons name="log-out-outline" size={16} color={palette.red_strong} />
      <Text style={styles.label}>로그아웃</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: palette.white,
    borderColor: palette.red_soft,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: palette.red_strong,
  },
});
