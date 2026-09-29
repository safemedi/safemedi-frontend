import { fireEvent, render } from "@testing-library/react-native";
import { SelectChip } from "../SelectChip";

jest.mock("tamagui", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    Button: ({
      children,
      onPress,
      accessibilityLabel,
    }: {
      children: React.ReactNode;
      onPress?: () => void;
      accessibilityLabel?: string;
    }) => React.createElement(Pressable, { onPress, accessibilityLabel }, children),
    Text: ({ children }: { children: React.ReactNode }) =>
      React.createElement(Text, null, children),
  };
});

describe("SelectChip", () => {
  it("label을 렌더링하고 클릭 시 onPress를 호출한다", () => {
    const handlePress = jest.fn();
    const { getByLabelText, getByText } = render(
      <SelectChip label="아침" selected={false} onPress={handlePress} />,
    );

    expect(getByText("아침")).toBeTruthy();
    fireEvent.press(getByLabelText("아침"));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it("accessibilityLabel 우선값을 사용한다", () => {
    const { getByLabelText } = render(
      <SelectChip label="점심" selected onPress={() => {}} accessibilityLabel="점심 선택칩" />,
    );

    expect(getByLabelText("점심 선택칩")).toBeTruthy();
  });
});
