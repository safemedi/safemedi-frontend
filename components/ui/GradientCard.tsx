import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

interface GradientPoint {
  readonly x: number;
  readonly y: number;
}

export interface GradientCardProps {
  readonly gradientColors: readonly [string, string, ...string[]];
  readonly gradientLocations?: readonly [number, number, ...number[]];
  readonly start?: GradientPoint;
  readonly end?: GradientPoint;
  readonly style?: StyleProp<ViewStyle>;
  readonly children: ReactNode;
}

const DEFAULT_GRADIENT_START: GradientPoint = { x: 0, y: 0 };
const DEFAULT_GRADIENT_END: GradientPoint = { x: 1, y: 1 };

export function GradientCard({
  gradientColors,
  gradientLocations,
  start = DEFAULT_GRADIENT_START,
  end = DEFAULT_GRADIENT_END,
  style,
  children,
}: GradientCardProps) {
  return (
    <LinearGradient
      colors={[...gradientColors]}
      locations={gradientLocations}
      start={start}
      end={end}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}
