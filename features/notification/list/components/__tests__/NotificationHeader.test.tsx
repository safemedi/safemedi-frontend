import { fireEvent, render } from "@testing-library/react-native";

import { NotificationHeader } from "../NotificationHeader";

const mockPressBack = jest.fn();
const mockPressMarkAllRead = jest.fn();

jest.mock("@expo/vector-icons/Ionicons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ name }: { name: string }) => React.createElement(Text, null, `icon-${name}`);
});

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

describe("NotificationHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("미읽음 알림 개수와 뒤로가기 액션을 렌더링한다", () => {
    const { getByLabelText, getByText } = render(
      <NotificationHeader
        unreadCount={3}
        onPressBack={mockPressBack}
        onPressMarkAllRead={mockPressMarkAllRead}
        isMarkAllReadDisabled={false}
      />,
    );

    expect(getByText("알림")).toBeTruthy();
    expect(getByText("3개의 새 알림")).toBeTruthy();
    expect(getByText("icon-arrow-back")).toBeTruthy();

    fireEvent.press(getByLabelText("이전 화면으로 이동"));

    expect(mockPressBack).toHaveBeenCalledTimes(1);
  });

  it("모두 읽음 버튼이 활성화되어 있으면 클릭 액션을 전달한다", () => {
    const { getByLabelText } = render(
      <NotificationHeader
        unreadCount={1}
        onPressBack={mockPressBack}
        onPressMarkAllRead={mockPressMarkAllRead}
        isMarkAllReadDisabled={false}
      />,
    );

    fireEvent.press(getByLabelText("모두 읽음"));

    expect(mockPressMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it("미읽음 알림이 없고 버튼이 비활성화되면 클릭 액션을 생략한다", () => {
    const { getByLabelText, getByText } = render(
      <NotificationHeader
        unreadCount={0}
        onPressBack={mockPressBack}
        onPressMarkAllRead={mockPressMarkAllRead}
        isMarkAllReadDisabled
      />,
    );

    expect(getByText("새로운 알림이 없습니다")).toBeTruthy();

    fireEvent.press(getByLabelText("모두 읽음"));

    expect(mockPressMarkAllRead).not.toHaveBeenCalled();
  });
});
