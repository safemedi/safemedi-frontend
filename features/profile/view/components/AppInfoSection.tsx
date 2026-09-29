import { StyleSheet, Text } from "react-native";

import { ListLinkRow } from "@/components/ui/ListLinkRow";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";

export type AppInfoLinkItem = {
  id: string;
  label: string;
  trailingText?: string;
  onPress?: () => void;
};

export type AppInfoSectionProps = {
  items: readonly AppInfoLinkItem[];
};

export function AppInfoSection({ items }: AppInfoSectionProps) {
  return (
    <SurfaceCard style={styles.card}>
      {items.map((item) => {
        const trailingText = item.trailingText ? (
          <Text style={styles.trailingText}>{item.trailingText}</Text>
        ) : null;

        return (
          <ListLinkRow
            key={item.id}
            title={item.label}
            trailing={trailingText}
            onPress={item.onPress}
            showChevron
            trailingIconName="open-outline"
            trailingIconSize={14}
            trailingIconColor={palette.icon}
            hasBorderBottom={item.id !== items[items.length - 1]?.id}
          />
        );
      })}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.white,
    borderColor: palette.dark_gray,
    overflow: "hidden",
  },
  trailingText: {
    fontSize: 11,
    color: palette.icon,
  },
});
