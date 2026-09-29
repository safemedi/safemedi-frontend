import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";

import { FAMILY_ACTIVE_STYLE } from "../constants";

export type FamilyProfileItemProps = {
  name: string;
  relation: string;
  isActive: boolean;
  avatarGradient: readonly [string, string];
};

export function FamilyProfileItem({
  name,
  relation,
  isActive,
  avatarGradient,
}: FamilyProfileItemProps) {
  return isActive ? (
    <LinearGradient
      colors={[...FAMILY_ACTIVE_STYLE.gradientColors]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.card, styles.activeCard, { borderColor: FAMILY_ACTIVE_STYLE.borderColor }]}
    >
      <ItemContent name={name} relation={relation} isActive avatarGradient={avatarGradient} />
    </LinearGradient>
  ) : (
    <SurfaceCard style={[styles.card, styles.inactiveCard]}>
      <ItemContent
        name={name}
        relation={relation}
        isActive={false}
        avatarGradient={avatarGradient}
      />
    </SurfaceCard>
  );
}

function ItemContent({
  name,
  relation,
  isActive,
  avatarGradient,
}: {
  name: string;
  relation: string;
  isActive: boolean;
  avatarGradient: readonly [string, string];
}) {
  return (
    <View style={styles.row}>
      <View style={styles.leading}>
        <LinearGradient
          colors={[...avatarGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Ionicons name="person" size={18} color={palette.white} />
        </LinearGradient>
        <View style={styles.textWrap}>
          <Text style={styles.name}>
            {isActive ? name : relation}
            {!isActive ? <Text style={styles.nickname}> ({name})</Text> : null}
          </Text>
          {isActive ? (
            <Text style={[styles.activeLabel, { color: FAMILY_ACTIVE_STYLE.activeTextColor }]}>
              현재 활성
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activeCard: {
    borderRadius: 18,
    borderWidth: 1,
  },
  inactiveCard: {
    borderColor: palette.surface_card_border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: "500",
    color: palette.text,
    letterSpacing: -0.15,
  },
  nickname: {
    fontSize: 11,
    fontWeight: "400",
    color: palette.icon,
  },
  activeLabel: {
    fontSize: 10,
    lineHeight: 14,
  },
});
