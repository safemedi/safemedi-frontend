import type { ReactNode } from "react";
import {
  type GestureResponderEvent,
  Pressable,
  type PressableAndroidRippleConfig,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { palette } from "@/constants/design-tokens";

export type ButtonProps = {
  onPress?: (event: GestureResponderEvent) => void;
  children: ReactNode;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: "button" | "link";
  style?: StyleProp<ViewStyle>;
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  backgroundColor?: string;
  pressedOpacity?: number;
  androidRipple?: PressableAndroidRippleConfig;
};

export function Button({
  onPress,
  children,
  disabled = false,
  accessibilityLabel,
  accessibilityRole = "button",
  style,
  width,
  height,
  borderRadius = 12,
  backgroundColor = "transparent",
  pressedOpacity = 0.85,
  androidRipple = { color: palette.overlay_black_10, borderless: false },
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      android_ripple={androidRipple}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        {
          width,
          height,
          borderRadius,
          backgroundColor,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? pressedOpacity : 1,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}
