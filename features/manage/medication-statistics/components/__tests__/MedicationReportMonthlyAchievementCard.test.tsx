import { render } from "@testing-library/react-native";

import { MedicationReportMonthlyAchievementCard } from "../MedicationReportMonthlyAchievementCard";

jest.mock("@expo/vector-icons/MaterialCommunityIcons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ name }: { name: string }) => React.createElement(Text, null, `icon-${name}`);
});

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LinearGradient: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

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

describe("MedicationReportMonthlyAchievementCard", () => {
  it("성과가 없으면 렌더링하지 않는다", () => {
    const { toJSON } = render(<MedicationReportMonthlyAchievementCard achievements={[]} />);

    expect(toJSON()).toBeNull();
  });

  it("성과 목록을 렌더링한다", () => {
    const { getAllByText, getByText } = render(
      <MedicationReportMonthlyAchievementCard
        achievements={["7일 연속 복약 완료", "복약 성공률 90% 달성"]}
      />,
    );

    expect(getByText("🏆 이번 달 성과")).toBeTruthy();
    expect(getByText("7일 연속 복약 완료")).toBeTruthy();
    expect(getByText("복약 성공률 90% 달성")).toBeTruthy();
    expect(getAllByText("icon-check-circle")).toHaveLength(2);
  });
});
