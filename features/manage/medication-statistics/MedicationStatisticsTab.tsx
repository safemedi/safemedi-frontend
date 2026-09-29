import { StyleSheet } from "react-native";
import { Text, YStack } from "tamagui";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PillButton } from "@/components/ui/PillButton";
import { palette } from "@/constants/design-tokens";
import { MedicationReportMonthlyAchievementCard } from "./components/MedicationReportMonthlyAchievementCard";
import { MedicationReportPeriodSummaryCard } from "./components/MedicationReportPeriodSummaryCard";
import { MedicationReportWeeklyComplianceCard } from "./components/MedicationReportWeeklyComplianceCard";
import { useMedicationStatisticsViewModel } from "./useMedicationStatisticsViewModel";

export function MedicationStatisticsTab() {
  const viewModel = useMedicationStatisticsViewModel();

  if (viewModel.isLoading) {
    return (
      <YStack style={styles.feedbackBox} gap={10}>
        <LoadingSpinner accessibilityLabel="통계 분석 로딩 중" />
        <Text style={styles.feedbackText}>통계 분석을 불러오는 중입니다.</Text>
      </YStack>
    );
  }

  if (viewModel.isError) {
    return (
      <YStack style={styles.feedbackBox} gap={10}>
        <Text style={styles.feedbackText}>통계 분석을 불러오지 못했습니다.</Text>
        <PillButton variant="outline" onPress={() => viewModel.refetch()} flex={0}>
          <Text style={styles.retryText}>다시 시도</Text>
        </PillButton>
      </YStack>
    );
  }

  return (
    <YStack gap={14}>
      <MedicationReportPeriodSummaryCard summary={viewModel.monthlySummary} />
      <MedicationReportWeeklyComplianceCard items={viewModel.weeklyCompliance} />
      <MedicationReportMonthlyAchievementCard achievements={viewModel.monthlyAchievements} />
    </YStack>
  );
}

const styles = StyleSheet.create({
  feedbackBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 42,
  },
  feedbackText: {
    color: palette.black,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  retryText: {
    color: palette.green_deep,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
});
