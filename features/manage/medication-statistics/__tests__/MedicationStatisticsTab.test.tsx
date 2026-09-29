import { fireEvent, render } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { MedicationStatisticsTab } from "../MedicationStatisticsTab";
import { useMedicationStatisticsViewModel } from "../useMedicationStatisticsViewModel";

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    Text: ({ children, ...p }: { children: React.ReactNode }) =>
      React.createElement(Text, p, children),
    YStack: ({ children, ...p }: { children: React.ReactNode }) =>
      React.createElement(View, p, children),
  };
});
jest.mock("@/components/ui/PillButton", () => {
  const React = require("react");
  const { Pressable } = require("react-native");
  return {
    PillButton: ({ onPress, children }: { onPress: () => void; children: ReactNode }) =>
      React.createElement(Pressable, { accessibilityLabel: "재시도", onPress }, children),
  };
});
jest.mock("../useMedicationStatisticsViewModel", () => ({
  useMedicationStatisticsViewModel: jest.fn(),
}));
jest.mock("../components/MedicationReportPeriodSummaryCard", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    MedicationReportPeriodSummaryCard: () => React.createElement(Text, null, "PERIOD_SUMMARY_CARD"),
  };
});
jest.mock("../components/MedicationReportWeeklyComplianceCard", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    MedicationReportWeeklyComplianceCard: () =>
      React.createElement(Text, null, "WEEKLY_COMPLIANCE_CARD"),
  };
});
jest.mock("../components/MedicationReportMonthlyAchievementCard", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    MedicationReportMonthlyAchievementCard: () =>
      React.createElement(Text, null, "MONTHLY_ACHIEVEMENT_CARD"),
  };
});
const hook = useMedicationStatisticsViewModel as jest.MockedFunction<
  typeof useMedicationStatisticsViewModel
>;
const refetch = jest.fn(async () => ({}));
const base = {
  weeklyCompliance: [],
  monthlySummary: {
    complianceRate: 0,
    periodRangeLabel: "4월 1일",
    totalTaken: 0,
    totalScheduled: 0,
    fraction: "0/0",
    perfectDaysCount: 0,
    attentionDaysCount: 0,
  },
  monthlyAchievements: [],
  isLoading: false,
  isError: false,
  refetch,
};
describe("MedicationStatisticsTab", () => {
  it("로딩, 오류 재시도, 정상 상태를 처리한다", () => {
    hook.mockReturnValue({ ...base, isLoading: true });
    const { getByText, queryByText, rerender, getByLabelText } = render(
      <MedicationStatisticsTab />,
    );
    expect(getByText("통계 분석을 불러오는 중입니다.")).toBeTruthy();
    hook.mockReturnValue({ ...base, isError: true });
    rerender(<MedicationStatisticsTab />);
    fireEvent.press(getByLabelText("재시도"));
    expect(refetch).toHaveBeenCalled();
    hook.mockReturnValue(base);
    rerender(<MedicationStatisticsTab />);
    expect(queryByText("통계 분석을 불러오는 중입니다.")).toBeNull();
    expect(queryByText("통계 분석을 불러오지 못했습니다.")).toBeNull();
    expect(getByText("PERIOD_SUMMARY_CARD")).toBeTruthy();
    expect(getByText("WEEKLY_COMPLIANCE_CARD")).toBeTruthy();
    expect(getByText("MONTHLY_ACHIEVEMENT_CARD")).toBeTruthy();
  });
});
