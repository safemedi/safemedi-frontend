import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";

import { layout } from "@/constants/design-tokens";
import { MedicationReportHeader } from "./components/MedicationReportHeader";
import { MedicationReportTabBar } from "./components/MedicationReportTabBar";
import { MedicationCalendarTab } from "./medication-calendar";
import { MedicationManagementTab } from "./medication-management";
import { MedicationStatisticsTab } from "./medication-statistics";
import type { MedicationReportTab } from "./types";

export function MedicationReportScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<MedicationReportTab>("calendar");

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 14, paddingBottom: layout.tabScreenBottomSpacing },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <YStack gap={14}>
        <MedicationReportHeader />

        <MedicationReportTabBar activeTab={activeTab} onChangeTab={setActiveTab} />

        {activeTab === "calendar" ? <MedicationCalendarTab /> : null}
        {activeTab === "statistics" ? <MedicationStatisticsTab /> : null}
        {activeTab === "management" ? <MedicationManagementTab /> : null}
      </YStack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
  },
});
