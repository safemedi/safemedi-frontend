import { fireEvent, render } from "@testing-library/react-native";
import { ManualJsonInputCard } from "../ManualJsonInputCard";

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Text: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(Text, props, children),
  };
});

describe("ManualJsonInputCard", () => {
  it("입력 변경과 취소/적용 이벤트를 전달한다", () => {
    const onChangeText = jest.fn();
    const onPressApply = jest.fn();
    const onPressCancel = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <ManualJsonInputCard
        value='{"title":"처방전"}'
        onChangeText={onChangeText}
        onPressApply={onPressApply}
        onPressCancel={onPressCancel}
      />,
    );

    fireEvent.changeText(getByPlaceholderText("JSON 입력"), "{}");
    fireEvent.press(getByText("취소"));
    fireEvent.press(getByText("적용"));

    expect(onChangeText).toHaveBeenCalledWith("{}");
    expect(onPressCancel).toHaveBeenCalledTimes(1);
    expect(onPressApply).toHaveBeenCalledTimes(1);
  });
});
