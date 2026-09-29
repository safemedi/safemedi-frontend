import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, type TextStyle, View, type ViewStyle } from "react-native";
import { palette } from "@/constants/design-tokens";

export type BadgeProps = {
  label: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  rightElement?: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Badge({
  label,
  backgroundColor = palette.dark_gray,
  textColor = palette.white,
  borderColor,
  borderWidth = 0,
  rightElement,
  onPress,
  style,
  textStyle,
}: BadgeProps) {
  const Container = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      style={[styles.badge, { backgroundColor, borderColor, borderWidth }, style]}
    >
      <Text style={[styles.text, { color: textColor }, textStyle]}>{label}</Text>
      {rightElement ? <View style={styles.right}>{rightElement}</View> : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 14,
  },
  right: {
    alignItems: "center",
    justifyContent: "center",
  },
});
