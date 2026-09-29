import { fireEvent, render } from "@testing-library/react-native";
import { MedicationReportScreen } from "../MedicationReportScreen";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
jest.mock("tamagui", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    YStack: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});
jest.mock("../components/MedicationReportHeader", () => ({ MedicationReportHeader: () => null }));
jest.mock("../medication-calendar", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { MedicationCalendarTab: () => React.createElement(Text, null, "CALENDAR_TAB") };
});
jest.mock("../medication-statistics", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { MedicationStatisticsTab: () => React.createElement(Text, null, "STATISTICS_TAB") };
});
jest.mock("../medication-management", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { MedicationManagementTab: () => React.createElement(Text, null, "MANAGEMENT_TAB") };
});
jest.mock("../components/MedicationReportTabBar", () => {
  const React = require("react");
  const { Pressable } = require("react-native");
  return {
    MedicationReportTabBar: ({
      onChangeTab,
    }: {
      onChangeTab: (tab: "calendar" | "statistics" | "management") => void;
    }) =>
      React.createElement(
        React.Fragment,
        null,
        ["calendar", "statistics", "management"].map((tab) =>
          React.createElement(Pressable, {
            key: tab,
            accessibilityLabel: tab,
            onPress: () => onChangeTab(tab as "calendar" | "statistics" | "management"),
          }),
        ),
      ),
  };
});

describe("MedicationReportScreen", () => {
  it("세 리포트 탭을 전환한다", () => {
    const { getByLabelText, queryByText } = render(<MedicationReportScreen />);

    expect(queryByText("CALENDAR_TAB")).toBeTruthy();
    expect(queryByText("STATISTICS_TAB")).toBeNull();
    expect(queryByText("MANAGEMENT_TAB")).toBeNull();

    fireEvent.press(getByLabelText("statistics"));
    expect(queryByText("STATISTICS_TAB")).toBeTruthy();
    expect(queryByText("CALENDAR_TAB")).toBeNull();
    expect(queryByText("MANAGEMENT_TAB")).toBeNull();

    fireEvent.press(getByLabelText("management"));
    expect(queryByText("MANAGEMENT_TAB")).toBeTruthy();
    expect(queryByText("CALENDAR_TAB")).toBeNull();
    expect(queryByText("STATISTICS_TAB")).toBeNull();

    fireEvent.press(getByLabelText("calendar"));
    expect(queryByText("CALENDAR_TAB")).toBeTruthy();
    expect(queryByText("STATISTICS_TAB")).toBeNull();
    expect(queryByText("MANAGEMENT_TAB")).toBeNull();
  });
});
