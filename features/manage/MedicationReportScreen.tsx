import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { YStack } from "tamagui";

import { MedicationReportHeader } from "./components/MedicationReportHeader";
import { MedicationReportTabBar } from "./components/MedicationReportTabBar";
import { MedicationCalendarTab } from "./medication-calendar";
import { MedicationManagementTab } from "./medication-management";
import { MedicationStatisticsTab } from "./medication-statistics";
import type { MedicationReportTab } from "./types";

export function MedicationReportScreen() {
  const [activeTab, setActiveTab] = useState<MedicationReportTab>("calendar");

  const header = (
    <YStack gap={14}>
      <MedicationReportHeader />
      <MedicationReportTabBar activeTab={activeTab} onChangeTab={setActiveTab} />
    </YStack>
  );

  return (
    <View style={styles.screen}>
      {activeTab === "calendar" ? <MedicationCalendarTab header={header} /> : null}
      {activeTab === "statistics" ? <MedicationStatisticsTab header={header} /> : null}
      {activeTab === "management" ? <MedicationManagementTab header={header} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
