import { fireEvent, render } from "@testing-library/react-native";

import { NotificationsScreen } from "../NotificationsScreen";

const mockHandlePressBack = jest.fn();
const mockHandlePressMarkAllRead = jest.fn();
const mockHandlePressNotification = jest.fn();
const mockRefetch = jest.fn();

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../useNotificationsViewModel", () => ({
  useNotificationsViewModel: () => ({
    items: [
      {
        notificationId: 1,
        type: "MEDICATION_REMINDER",
        title: "약 복용 시간입니다",
        message: "암로디핀정 5mg을 복용할 시간이에요",
        isRead: false,
        targetType: "MEDICATION_RECORD",
        targetId: 500,
        createdAt: "2026-04-07T08:50:00",
      },
      {
        notificationId: 2,
        type: "MEDICATION_COMPLETED",
        title: "복약 완료",
        message: "타이레놀정 500mg 복용을 완료했어요",
        isRead: true,
        targetType: "MEDICATION_RECORD",
        targetId: 501,
        createdAt: "2026-04-07T07:00:00",
      },
    ],
    unreadCount: 1,
    isLoading: false,
    isError: false,
    isMarkAllReadPending: false,
    refetch: mockRefetch,
    handlePressBack: mockHandlePressBack,
    handlePressMarkAllRead: mockHandlePressMarkAllRead,
    handlePressNotification: mockHandlePressNotification,
  }),
}));

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

jest.mock("@/components/ui/PillButton", () => {
  const React = require("react");
  const { Pressable } = require("react-native");
  return {
    PillButton: ({ onPress, children }: { onPress: () => void; children: React.ReactNode }) =>
      React.createElement(Pressable, { onPress }, children),
  };
});

jest.mock("@/components/ui/SurfaceCard", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    SurfaceCard: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

describe("NotificationsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("알림 헤더와 카드 목록을 렌더링한다", () => {
    const { getByText } = render(<NotificationsScreen />);

    expect(getByText("알림")).toBeTruthy();
    expect(getByText("1개의 새 알림")).toBeTruthy();
    expect(getByText("약 복용 시간입니다")).toBeTruthy();
    expect(getByText("복약 완료")).toBeTruthy();
  });

  it("모두 읽음 버튼 클릭 시 핸들러를 호출한다", () => {
    const { getByLabelText } = render(<NotificationsScreen />);

    fireEvent.press(getByLabelText("모두 읽음"));

    expect(mockHandlePressMarkAllRead).toHaveBeenCalledTimes(1);
  });
});
