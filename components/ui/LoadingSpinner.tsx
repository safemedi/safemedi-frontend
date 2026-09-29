import { ActivityIndicator, type ActivityIndicatorProps } from "react-native";

import { palette } from "@/constants/design-tokens";

export type LoadingSpinnerProps = Omit<ActivityIndicatorProps, "color" | "size"> & {
  color?: string;
  size?: ActivityIndicatorProps["size"];
};

export function LoadingSpinner({
  color = palette.blue,
  size = "large",
  accessibilityLabel = "로딩 중",
  ...props
}: LoadingSpinnerProps) {
  return (
    <ActivityIndicator
      {...props}
      size={size}
      color={color}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
