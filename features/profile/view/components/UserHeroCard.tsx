import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { GradientCard } from "@/components/ui/GradientCard";
import { palette } from "@/constants/design-tokens";

export type UserHeroCardProps = {
  name: string;
  role: string;
  onPress?: () => void;
};

const HERO_GRADIENT_LOCATIONS = [0, 0.5, 1] as const;

export function UserHeroCard({ name, role, onPress }: UserHeroCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}
    >
      <GradientCard
        gradientColors={palette.bg_green_line}
        gradientLocations={HERO_GRADIENT_LOCATIONS}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={palette.white} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.role}>{role}</Text>
          </View>
          <View style={styles.chevron}>
            <Ionicons name="chevron-forward" size={18} color={palette.white} />
          </View>
        </View>
      </GradientCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  pressed: {
    opacity: 0.9,
  },
  gradient: {
    padding: 18,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.overlay_white_20,
    borderWidth: 1,
    borderColor: palette.overlay_white_20,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.white,
    letterSpacing: -0.3,
  },
  role: {
    fontSize: 12,
    color: palette.white,
    opacity: 0.9,
  },
  chevron: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.overlay_white_20,
    borderWidth: 1,
    borderColor: palette.overlay_white_20,
    alignItems: "center",
    justifyContent: "center",
  },
});
