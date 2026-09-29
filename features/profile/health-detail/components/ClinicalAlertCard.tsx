import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";

import { ALERT_TONE_COLORS } from "../constants";
import type { ClinicalAlertSection } from "../types";

export interface ClinicalAlertCardProps {
  readonly section: ClinicalAlertSection;
  readonly iconName: React.ComponentProps<typeof Ionicons>["name"];
}

interface AlertItemRowProps {
  readonly index: number;
  readonly title: string;
  readonly description: string;
  readonly badgeLabel: string;
  readonly tone: ClinicalAlertSection["tone"];
}

function AlertItemRow({ index, title, description, badgeLabel, tone }: AlertItemRowProps) {
  const toneColor = ALERT_TONE_COLORS[tone];

  return (
    <LinearGradient
      colors={[...toneColor.gradientColors]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.itemCard, { borderColor: toneColor.borderColor }]}
    >
      <View style={styles.itemRow}>
        <View style={[styles.indexCircle, { backgroundColor: toneColor.indexBackgroundColor }]}>
          <Text style={styles.indexText}>{index + 1}</Text>
        </View>
        <View style={styles.itemTextWrap}>
          <Text style={[styles.itemTitle, { color: toneColor.titleColor }]}>{title}</Text>
          <Text style={[styles.itemDescription, { color: toneColor.subtitleColor }]}>
            {description}
          </Text>
        </View>
        <Badge
          label={badgeLabel}
          backgroundColor={toneColor.badgeBackgroundColor}
          style={styles.badge}
          textStyle={styles.badgeText}
        />
      </View>
    </LinearGradient>
  );
}

export function ClinicalAlertCard({ section, iconName }: ClinicalAlertCardProps) {
  const toneColor = ALERT_TONE_COLORS[section.tone];

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.headerIconWrap, { backgroundColor: toneColor.badgeBackgroundColor }]}>
          <Ionicons name={iconName} size={16} color={palette.white} />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerTitle, { color: toneColor.titleColor }]}>{section.title}</Text>
          <Text style={[styles.headerSubtitle, { color: toneColor.subtitleColor }]}>
            {section.subtitle}
          </Text>
        </View>
      </View>
      <View style={styles.itemsWrap}>
        {section.items.map((item, index) => (
          <AlertItemRow
            key={item.id}
            index={index}
            title={item.title}
            description={item.description}
            badgeLabel={item.badgeLabel}
            tone={section.tone}
          />
        ))}
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextWrap: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    letterSpacing: -0.15,
  },
  headerSubtitle: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: "400",
  },
  itemsWrap: {
    gap: 10,
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  indexCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  indexText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    color: palette.white,
  },
  itemTextWrap: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    letterSpacing: -0.15,
  },
  itemDescription: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  badge: {
    marginTop: 2,
    minWidth: 34,
  },
  badgeText: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: "500",
  },
});
