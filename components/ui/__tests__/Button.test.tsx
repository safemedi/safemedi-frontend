import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";
import { Button } from "../Button";

describe("Button", () => {
  it("클릭 시 onPress를 호출한다", () => {
    const handlePress = jest.fn();
    const { getByLabelText } = render(
      <Button accessibilityLabel="기본 버튼" onPress={handlePress}>
        <Text>확인</Text>
      </Button>,
    );

    fireEvent.press(getByLabelText("기본 버튼"));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it("disabled면 onPress를 호출하지 않는다", () => {
    const handlePress = jest.fn();
    const { getByLabelText } = render(
      <Button accessibilityLabel="비활성 버튼" disabled onPress={handlePress}>
        <Text>비활성</Text>
      </Button>,
    );

    fireEvent.press(getByLabelText("비활성 버튼"));
    expect(handlePress).not.toHaveBeenCalled();
  });
});
