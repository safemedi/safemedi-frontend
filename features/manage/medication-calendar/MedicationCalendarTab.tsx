import { StyleSheet } from "react-native";
import { Text, YStack } from "tamagui";
import { PillButton } from "@/components/ui/PillButton";
import { ScreenLoadingView } from "@/components/ui/ScreenLoadingView";
import { palette } from "@/constants/design-tokens";
import {
  MedicationReportTabContent,
  type MedicationReportTabProps,
} from "@/features/manage/components/MedicationReportTabContent";
import { MedicationReportPeriodSummaryCard } from "../medication-statistics/components/MedicationReportPeriodSummaryCard";
import { MedicationReportCalendarCard } from "./components/MedicationReportCalendarCard";
import { MedicationReportDailyRecordsCard } from "./components/MedicationReportDailyRecordsCard";
import { useMedicationCalendarViewModel } from "./useMedicationCalendarViewModel";

export function MedicationCalendarTab({ header }: MedicationReportTabProps) {
  const viewModel = useMedicationCalendarViewModel();

  if (
    viewModel.isInitialLoading ||
    viewModel.isCalendarLoading ||
    viewModel.isDailyRecordsLoading
  ) {
    return (
      <ScreenLoadingView
        accessibilityLabel="복약 리포트 로딩 중"
        message="복약 리포트를 불러오는 중입니다."
      />
    );
  }

  if (viewModel.isError) {
    return (
      <MedicationReportTabContent header={header}>
        <YStack style={styles.feedbackBox} gap={10}>
          <Text style={styles.feedbackText}>복약 리포트를 불러오지 못했습니다.</Text>
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
        <MedicationReportPeriodSummaryCard summary={viewModel.periodSummary} />

        <MedicationReportCalendarCard
          monthLabel={viewModel.monthLabel}
          weeks={viewModel.calendarWeeks}
          selectedDate={viewModel.selectedDate}
          onSelectDate={viewModel.setSelectedDate}
          onPreviousMonth={viewModel.goToPreviousMonth}
          onNextMonth={viewModel.goToNextMonth}
          canGoToNextMonth={viewModel.canGoToNextMonth}
        />

        <MedicationReportDailyRecordsCard
          title={viewModel.selectedDateTitle}
          summary={viewModel.selectedDaySummary}
          prescriptionGroups={viewModel.prescriptionGroups}
          isError={viewModel.isDailyRecordsError}
          onRetry={() => viewModel.refetchDailyRecords()}
        />
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
