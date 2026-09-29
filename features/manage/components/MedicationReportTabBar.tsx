import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "tamagui";

import { palette } from "@/constants/design-tokens";
import type { MedicationReportTab } from "../types";

interface MedicationReportTabBarProps {
  readonly activeTab: MedicationReportTab;
  readonly onChangeTab: (tab: MedicationReportTab) => void;
}

const TAB_ITEMS: readonly { readonly id: MedicationReportTab; readonly label: string }[] = [
  { id: "calendar", label: "복약 캘린더" },
  { id: "statistics", label: "통계 분석" },
  { id: "management", label: "복약 관리" },
];

export function MedicationReportTabBar({ activeTab, onChangeTab }: MedicationReportTabBarProps) {
  return (
    <View style={styles.container}>
      {TAB_ITEMS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChangeTab(tab.id)}
            style={[styles.tab, isActive ? styles.activeTab : null]}
          >
            <Text style={[styles.tabLabel, isActive ? styles.activeTabLabel : null]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: palette.surface_neutral,
    borderRadius: 18,
    padding: 3,
    gap: 2,
  },
  tab: {
    flex: 1,
    minHeight: 26,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  activeTab: {
    backgroundColor: palette.white,
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabLabel: {
    color: palette.title_emphasis,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
    textAlign: "center",
  },
  activeTabLabel: {
    fontWeight: "600",
  },
});
