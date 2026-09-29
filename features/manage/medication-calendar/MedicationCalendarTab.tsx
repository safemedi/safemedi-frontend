import { StyleSheet } from "react-native";
import { Text, YStack } from "tamagui";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PillButton } from "@/components/ui/PillButton";
import { palette } from "@/constants/design-tokens";
import { MedicationReportPeriodSummaryCard } from "../medication-statistics/components/MedicationReportPeriodSummaryCard";
import { MedicationReportCalendarCard } from "./components/MedicationReportCalendarCard";
import { MedicationReportDailyRecordsCard } from "./components/MedicationReportDailyRecordsCard";
import { useMedicationCalendarViewModel } from "./useMedicationCalendarViewModel";

export function MedicationCalendarTab() {
  const viewModel = useMedicationCalendarViewModel();

  if (viewModel.isInitialLoading) {
    return (
      <YStack style={styles.feedbackBox} gap={10}>
        <LoadingSpinner accessibilityLabel="복약 리포트 로딩 중" />
        <Text style={styles.feedbackText}>복약 리포트를 불러오는 중입니다.</Text>
      </YStack>
    );
  }

  if (viewModel.isError) {
    return (
      <YStack style={styles.feedbackBox} gap={10}>
        <Text style={styles.feedbackText}>복약 리포트를 불러오지 못했습니다.</Text>
        <PillButton variant="outline" onPress={() => viewModel.refetch()} flex={0}>
          <Text style={styles.retryText}>다시 시도</Text>
        </PillButton>
      </YStack>
    );
  }

  return (
    <YStack gap={14}>
      <MedicationReportPeriodSummaryCard summary={viewModel.periodSummary} />

      <MedicationReportCalendarCard
        monthLabel={viewModel.monthLabel}
        weeks={viewModel.calendarWeeks}
        selectedDate={viewModel.selectedDate}
        onSelectDate={viewModel.setSelectedDate}
        onPreviousMonth={viewModel.goToPreviousMonth}
        onNextMonth={viewModel.goToNextMonth}
        canGoToNextMonth={viewModel.canGoToNextMonth}
        isLoading={viewModel.isCalendarLoading}
      />

      <MedicationReportDailyRecordsCard
        title={viewModel.selectedDateTitle}
        summary={viewModel.selectedDaySummary}
        prescriptionGroups={viewModel.prescriptionGroups}
        isLoading={viewModel.isDailyRecordsLoading}
        isError={viewModel.isDailyRecordsError}
        onRetry={() => viewModel.refetchDailyRecords()}
      />
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
