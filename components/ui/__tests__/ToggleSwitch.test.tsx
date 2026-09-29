import { fireEvent, render } from "@testing-library/react-native";
import { ToggleSwitch } from "../ToggleSwitch";

jest.mock("tamagui", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");

  const Switch = ({
    checked,
    onCheckedChange,
    disabled,
    accessibilityLabel,
    children,
  }: {
    checked: boolean;
    onCheckedChange: (next: boolean) => void;
    disabled?: boolean;
    accessibilityLabel?: string;
    children: React.ReactNode;
  }) =>
    React.createElement(
      Pressable,
      {
        accessibilityLabel,
        disabled,
        onPress: () => onCheckedChange(!checked),
      },
      children,
    );

  Switch.Thumb = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(Text, null, children ?? "thumb");

  return { Switch };
});

describe("ToggleSwitch", () => {
  it("토글 시 onValueChange를 호출한다", () => {
    const handleChange = jest.fn();
    const { getByLabelText } = render(
      <ToggleSwitch value={false} onValueChange={handleChange} accessibilityLabel="알림 토글" />,
    );

    fireEvent.press(getByLabelText("알림 토글"));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("disabled면 토글 이벤트가 발생하지 않는다", () => {
    const handleChange = jest.fn();
    const { getByLabelText } = render(
      <ToggleSwitch
        value={true}
        onValueChange={handleChange}
        disabled
        accessibilityLabel="비활성 토글"
      />,
    );

    fireEvent.press(getByLabelText("비활성 토글"));
    expect(handleChange).not.toHaveBeenCalled();
  });
});
