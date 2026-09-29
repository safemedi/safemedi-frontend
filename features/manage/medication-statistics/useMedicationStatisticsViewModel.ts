import { useMemo } from "react";

import { useMedicationStatistics } from "@/api/queries/medications";
import {
  buildMedicationReportPeriodSummary,
  buildMedicationReportWeeklyCompliance,
  deriveMedicationReportMonthlyAchievements,
  getMedicationReportMonthRange,
  getMedicationReportWeekRange,
  type MedicationReportPeriodSummary,
  type MedicationReportWeeklyComplianceItem,
} from "./medicationReportStatistics";

export interface MedicationStatisticsViewModel {
  readonly weeklyCompliance: readonly MedicationReportWeeklyComplianceItem[];
  readonly monthlySummary: MedicationReportPeriodSummary;
  readonly monthlyAchievements: readonly string[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly refetch: () => Promise<unknown>;
}

export function useMedicationStatisticsViewModel(
  today = new Date(),
): MedicationStatisticsViewModel {
  const weekRange = useMemo(() => getMedicationReportWeekRange(today), [today]);
  const monthRange = useMemo(() => getMedicationReportMonthRange(today), [today]);
  const weeklyStatisticsQuery = useMedicationStatistics({
    startDate: weekRange.startDate,
    endDate: weekRange.endDate,
  });
  const monthlyStatisticsQuery = useMedicationStatistics({
    startDate: monthRange.startDate,
    endDate: monthRange.endDate,
  });

  const weeklyCompliance = useMemo(
    () =>
      buildMedicationReportWeeklyCompliance(
        weeklyStatisticsQuery.data?.dailyCompliance ?? [],
        weekRange.weekStart,
        today,
      ),
    [today, weekRange.weekStart, weeklyStatisticsQuery.data?.dailyCompliance],
  );

  const monthlySummary = useMemo(
    () => buildMedicationReportPeriodSummary(monthlyStatisticsQuery.data, today),
    [monthlyStatisticsQuery.data, today],
  );

  const monthlyAchievements = useMemo(
    () => deriveMedicationReportMonthlyAchievements(monthlyStatisticsQuery.data),
    [monthlyStatisticsQuery.data],
  );

  return {
    weeklyCompliance,
    monthlySummary,
    monthlyAchievements,
    isLoading: weeklyStatisticsQuery.isLoading || monthlyStatisticsQuery.isLoading,
    isError: weeklyStatisticsQuery.isError || monthlyStatisticsQuery.isError,
    refetch: async () => {
      await Promise.all([weeklyStatisticsQuery.refetch(), monthlyStatisticsQuery.refetch()]);
    },
  };
}
