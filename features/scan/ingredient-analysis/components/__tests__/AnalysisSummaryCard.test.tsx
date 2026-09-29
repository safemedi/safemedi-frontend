import { render } from "@testing-library/react-native";
import { AnalysisSummaryCard } from "../AnalysisSummaryCard";

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    Text: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(Text, props, children),
    YStack: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

describe("AnalysisSummaryCard", () => {
  it("분석 요약 텍스트와 카운트를 렌더링한다", () => {
    const { getByText } = render(
      <AnalysisSummaryCard
        analyzedMedicationCount={3}
        dangerCount={1}
        cautionCount={1}
        safeCount={1}
      />,
    );

    expect(getByText("종합 안전도 분석")).toBeTruthy();
    expect(getByText("3개 약물 분석 완료")).toBeTruthy();
    expect(getByText("위험 1")).toBeTruthy();
    expect(getByText("주의 1")).toBeTruthy();
    expect(getByText("안전 1")).toBeTruthy();
  });
});
