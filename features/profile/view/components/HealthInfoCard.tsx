import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { palette } from "@/constants/design-tokens";

import { HEALTH_INFO_STYLES, type HealthInfoVariant } from "../constants";

export type HealthInfoCardProps = {
  variant: HealthInfoVariant;
  icon: ReactNode;
  title: string;
  items: readonly string[];
  onEdit?: () => void;
};

export function HealthInfoCard({ variant, icon, title, items, onEdit }: HealthInfoCardProps) {
  const style = HEALTH_INFO_STYLES[variant];

  return (
    <LinearGradient
      colors={[...style.gradientColors]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.card, { borderColor: style.borderColor }]}
    >
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          {icon}
          <Text style={[styles.title, { color: style.titleColor }]}>{title}</Text>
        </View>
      </View>
      <View style={styles.badgeRow}>
        {items.map((label) => (
          <Badge
            key={label}
            label={label}
            backgroundColor={style.badgeColor}
            textColor={palette.white}
          />
        ))}
        <Pressable onPress={onEdit} hitSlop={8} style={styles.editButton}>
          <Text style={[styles.editText, { color: style.editTextColor }]}>편집</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 8,
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.15,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  editButton: {
    paddingHorizontal: 2,
  },
  editText: {
    fontSize: 11,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
