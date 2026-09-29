import { fireEvent, render } from "@testing-library/react-native";
import { MedicationHistoryHeader } from "../MedicationHistoryHeader";

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

describe("MedicationHistoryHeader", () => {
  it("타이틀/날짜를 렌더링하고 뒤로가기 클릭을 전달한다", () => {
    const onPressBack = jest.fn();
    const { getByText, getByLabelText } = render(
      <MedicationHistoryHeader
        title="복약 히스토리"
        dateLabel="2026-05-20"
        onPressBack={onPressBack}
      />,
    );

    expect(getByText("복약 히스토리")).toBeTruthy();
    expect(getByText("2026-05-20")).toBeTruthy();

    fireEvent.press(getByLabelText("이전 화면으로 이동"));
    expect(onPressBack).toHaveBeenCalledTimes(1);
  });
});
