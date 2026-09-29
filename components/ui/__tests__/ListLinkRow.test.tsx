import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";
import { ListLinkRow } from "../ListLinkRow";

const mockPress = jest.fn();

jest.mock("@expo/vector-icons/Ionicons", () => {
  const React = require("react");
  const { Text: NativeText } = require("react-native");
  return ({ name }: { name: string }) => React.createElement(NativeText, null, `icon-${name}`);
});

describe("ListLinkRow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("제목/부제/chevron/trailing을 렌더링하고 클릭 이벤트를 전달한다", () => {
    const { getByText, getByLabelText } = render(
      <ListLinkRow
        title="설정"
        subtitle="설정 설명"
        showChevron
        trailing={<Text accessibilityLabel="trailing-node">TRAIL</Text>}
        onPress={mockPress}
        hasBorderBottom
      />,
    );

    expect(getByText("설정")).toBeTruthy();
    expect(getByText("설정 설명")).toBeTruthy();
    expect(getByText("icon-chevron-forward")).toBeTruthy();
    expect(getByLabelText("trailing-node")).toBeTruthy();
    fireEvent.press(getByText("설정"));
    expect(mockPress).toHaveBeenCalledTimes(1);
  });

  it("onPress가 없으면 비활성 상태로 렌더링된다", () => {
    const { getByText } = render(<ListLinkRow title="읽기 전용" />);
    fireEvent.press(getByText("읽기 전용"));
    expect(mockPress).not.toHaveBeenCalled();
  });

  it("커스텀 chevron 아이콘 속성을 반영한다", () => {
    const { getByText } = render(
      <ListLinkRow
        title="프로필"
        showChevron
        trailingIconName="person"
        trailingIconSize={20}
        trailingIconColor="#111111"
      />,
    );

    expect(getByText("icon-person")).toBeTruthy();
  });
});
