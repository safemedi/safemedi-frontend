import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { palette } from "@/constants/design-tokens";

export type SurfaceCardProps = {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
};

export function SurfaceCard({ children, style }: SurfaceCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface_card,
    borderWidth: 1,
    borderColor: palette.surface_card_border,
    borderRadius: 18,
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
});
