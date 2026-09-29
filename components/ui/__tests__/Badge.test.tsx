import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";
import { Badge } from "../Badge";

describe("Badge", () => {
  it("라벨과 rightElement를 렌더링한다", () => {
    const { getByText } = render(<Badge label="경고" rightElement={<Text>!</Text>} />);

    expect(getByText("경고")).toBeTruthy();
    expect(getByText("!")).toBeTruthy();
  });

  it("onPress가 있으면 클릭 이벤트를 전달한다", () => {
    const handlePress = jest.fn();
    const { getByText } = render(<Badge label="클릭 배지" onPress={handlePress} />);

    fireEvent.press(getByText("클릭 배지"));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });
});
