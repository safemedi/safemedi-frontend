import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Text, XStack } from "tamagui";

import { palette } from "@/constants/design-tokens";

export type SectionHeaderProps = {
  icon?: ReactNode;
  title: string;
  action?: ReactNode;
};

export function SectionHeader({ icon, title, action }: SectionHeaderProps) {
  return (
    <XStack items="center" justify="space-between" width="100%">
      <XStack items="center" gap={8}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <Text style={styles.title}>{title}</Text>
      </XStack>
      {action}
    </XStack>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.black,
    letterSpacing: -0.15,
  },
});
