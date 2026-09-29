import { render } from "@testing-library/react-native";

import { MedicationReportWeeklyComplianceCard } from "../MedicationReportWeeklyComplianceCard";

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    Text: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(Text, props, children),
    XStack: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
    YStack: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

describe("MedicationReportWeeklyComplianceCard", () => {
  it("fraction과 이행률, 미래 일정을 표시한다", () => {
    const { getByText } = render(
      <MedicationReportWeeklyComplianceCard
        items={[
          { dayLabel: "월", rate: 100, fraction: "5/5", tone: "success" },
          { dayLabel: "화", rate: 65, fraction: "13/20", tone: "warning" },
          { dayLabel: "수", rate: null, fraction: null, tone: "future" },
        ]}
      />,
    );
    expect(getByText("5/5 (100%)")).toBeTruthy();
    expect(getByText("13/20 (65%)")).toBeTruthy();
    expect(getByText("예정")).toBeTruthy();
  });
});
