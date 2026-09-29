import type { ReactNode } from "react";
import { Pressable } from "react-native";
import { palette } from "@/constants/design-tokens";

const BORDER_SUBTLE = palette.dark_gray;

const SIZE_PADDING = {
  md: { paddingVertical: 14, paddingHorizontal: 16 },
  sm: { paddingVertical: 8, paddingHorizontal: 12 },
} as const;

export type PillButtonProps = {
  variant: "outline" | "solid";
  onPress: () => void;
  children: ReactNode;
  disabled?: boolean;
  accessibilityLabel?: string;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  flex?: number;
  borderColor?: string;
  backgroundColor?: string;
  size?: "md" | "sm";
};

export function PillButton({
  variant,
  onPress,
  children,
  disabled = false,
  accessibilityLabel,
  leftElement,
  rightElement,
  flex: flexGrow = 1,
  borderColor = BORDER_SUBTLE,
  backgroundColor,
  size = "md",
}: PillButtonProps) {
  const isOutline = variant === "outline";
  const resolvedBackgroundColor =
    backgroundColor ?? (isOutline ? palette.surface_card : palette.green);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => {
        let opacity = 1;
        if (disabled) {
          opacity = isOutline ? 0.35 : 0.45;
        } else if (pressed) {
          opacity = isOutline ? 0.85 : 0.9;
        }
        return {
          flex: flexGrow,
          opacity,
          ...SIZE_PADDING[size],
          borderRadius: 999,
          ...(isOutline
            ? {
                borderWidth: 1,
                borderColor,
                backgroundColor: resolvedBackgroundColor,
              }
            : {
                backgroundColor: resolvedBackgroundColor,
              }),
          alignItems: "center",
          justifyContent: "center",
          flexDirection: leftElement || rightElement ? "row" : undefined,
          gap: leftElement || rightElement ? 6 : undefined,
        };
      }}
    >
      {leftElement}
      {children}
      {rightElement}
    </Pressable>
  );
}
