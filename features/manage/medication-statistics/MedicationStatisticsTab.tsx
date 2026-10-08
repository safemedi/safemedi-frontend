import { StyleSheet } from "react-native";
import { Text, YStack } from "tamagui";
import { PillButton } from "@/components/ui/PillButton";
import { ScreenLoadingView } from "@/components/ui/ScreenLoadingView";
import { palette } from "@/constants/design-tokens";
import {
  MedicationReportTabContent,
  type MedicationReportTabProps,
} from "@/features/manage/components/MedicationReportTabContent";
import { MedicationReportMonthlyAchievementCard } from "./components/MedicationReportMonthlyAchievementCard";
import { MedicationReportPeriodSummaryCard } from "./components/MedicationReportPeriodSummaryCard";
import { MedicationReportWeeklyComplianceCard } from "./components/MedicationReportWeeklyComplianceCard";
import { useMedicationStatisticsViewModel } from "./useMedicationStatisticsViewModel";

export function MedicationStatisticsTab({ header }: MedicationReportTabProps) {
  const viewModel = useMedicationStatisticsViewModel();

  if (viewModel.isLoading) {
    return (
      <ScreenLoadingView
        accessibilityLabel="통계 분석 로딩 중"
        message="통계 분석을 불러오는 중입니다."
      />
    );
  }

  if (viewModel.isError) {
    return (
      <MedicationReportTabContent header={header}>
        <YStack style={styles.feedbackBox} gap={10}>
          <Text style={styles.feedbackText}>통계 분석을 불러오지 못했습니다.</Text>
          <PillButton variant="outline" onPress={() => viewModel.refetch()} flex={0}>
            <Text style={styles.retryText}>다시 시도</Text>
          </PillButton>
        </YStack>
      </MedicationReportTabContent>
    );
  }

  return (
    <MedicationReportTabContent header={header}>
      <YStack gap={14}>
        <MedicationReportPeriodSummaryCard summary={viewModel.monthlySummary} />
        <MedicationReportWeeklyComplianceCard items={viewModel.weeklyCompliance} />
        <MedicationReportMonthlyAchievementCard achievements={viewModel.monthlyAchievements} />
      </YStack>
    </MedicationReportTabContent>
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
