import { render } from "@testing-library/react-native";
import { AdherenceSummaryCard } from "../home/components/AdherenceSummaryCard";
import { HealthTipCard } from "../home/components/HealthTipCard";
import { MedicationWarningBanner } from "../medication-history/components/MedicationWarningBanner";

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

describe("dashboard extra components", () => {
  it("AdherenceSummaryCard는 이행률 텍스트를 렌더링한다", () => {
    const { getByText } = render(
      <AdherenceSummaryCard adherenceRate={87} adherenceSummaryText="7 / 8 완료" />,
    );

    expect(getByText("오늘의 복약 이행률")).toBeTruthy();
    expect(getByText("7 / 8 완료")).toBeTruthy();
    expect(getByText("87%")).toBeTruthy();
  });

  it("HealthTipCard는 제목과 설명을 렌더링한다", () => {
    const { getByText } = render(
      <HealthTipCard title="건강 팁" description="물 충분히 섭취하세요." />,
    );

    expect(getByText("💡")).toBeTruthy();
    expect(getByText("건강 팁")).toBeTruthy();
    expect(getByText("물 충분히 섭취하세요.")).toBeTruthy();
  });

  it("MedicationWarningBanner는 경고 문구를 렌더링한다", () => {
    const { getByText } = render(
      <MedicationWarningBanner description="복약 시간을 다시 확인해주세요." />,
    );

    expect(getByText("주의가 필요합니다")).toBeTruthy();
    expect(getByText("복약 시간을 다시 확인해주세요.")).toBeTruthy();
  });
});
