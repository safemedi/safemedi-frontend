import { fireEvent, render } from "@testing-library/react-native";

import { MedicationReportTabBar } from "../MedicationReportTabBar";

const mockChangeTab = jest.fn();

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Text: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(Text, props, children),
  };
});

describe("MedicationReportTabBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("활성 탭을 선택 상태로 렌더링하고 탭 변경을 전달한다", () => {
    const { getByRole, getByText } = render(
      <MedicationReportTabBar activeTab="calendar" onChangeTab={mockChangeTab} />,
    );

    expect(getByRole("button", { name: "복약 캘린더" }).props.accessibilityState).toEqual({
      selected: true,
    });
    expect(getByRole("button", { name: "통계 분석" }).props.accessibilityState).toEqual({
      selected: false,
    });

    fireEvent.press(getByText("통계 분석"));

    expect(mockChangeTab).toHaveBeenCalledWith("statistics");
  });

  it("관리 탭이 활성화된 상태도 렌더링한다", () => {
    const { getByRole } = render(
      <MedicationReportTabBar activeTab="management" onChangeTab={mockChangeTab} />,
    );

    expect(getByRole("button", { name: "복약 관리" }).props.accessibilityState).toEqual({
      selected: true,
    });
  });
});
