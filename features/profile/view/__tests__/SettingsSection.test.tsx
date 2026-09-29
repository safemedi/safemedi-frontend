import { fireEvent, render } from "@testing-library/react-native";
import { SettingsSection } from "../components/SettingsSection";

const mockMutate = jest.fn();

let mockSettings:
  | { isMyReminderOn: boolean; isFamilyReminderOn: boolean; isMissedAlertOn: boolean }
  | undefined = {
  isMyReminderOn: true,
  isFamilyReminderOn: false,
  isMissedAlertOn: true,
};
let mockIsPending = false;

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    Text: ({ children }: { children: React.ReactNode }) =>
      React.createElement(Text, null, children),
    YStack: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock("@/api/queries/profile", () => ({
  useNotificationSettings: () => ({ data: mockSettings }),
  useUpdateNotificationSettings: () => ({ mutate: mockMutate, isPending: mockIsPending }),
}));

jest.mock("@/components/ui/SurfaceCard", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    SurfaceCard: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock("@/components/ui/ListLinkRow", () => {
  const React = require("react");
  const { Pressable, Text, View } = require("react-native");
  return {
    ListLinkRow: ({
      title,
      onPress,
      trailing,
    }: {
      title: string;
      onPress?: () => void;
      trailing?: React.ReactNode;
    }) =>
      React.createElement(
        Pressable,
        { onPress, accessibilityLabel: `row-${title}` },
        React.createElement(Text, null, title),
        React.createElement(View, null, trailing),
      ),
  };
});

jest.mock("@/components/ui/ToggleSwitch", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    ToggleSwitch: ({
      value,
      onValueChange,
      disabled,
      accessibilityLabel,
    }: {
      value: boolean;
      onValueChange: (next: boolean) => void;
      disabled?: boolean;
      accessibilityLabel?: string;
    }) =>
      React.createElement(
        Pressable,
        {
          accessibilityLabel,
          disabled,
          onPress: () => onValueChange(!value),
        },
        React.createElement(Text, null, String(value)),
      ),
  };
});

describe("SettingsSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPending = false;
    mockSettings = {
      isMyReminderOn: true,
      isFamilyReminderOn: false,
      isMissedAlertOn: true,
    };
  });

  it("알림 토글 변경 시 해당 키로 patch mutate를 호출한다", () => {
    const { getByLabelText } = render(<SettingsSection />);

    fireEvent.press(getByLabelText("복약 알림 토글"));
    expect(mockMutate).toHaveBeenCalledWith({ isMyReminderOn: false });

    fireEvent.press(getByLabelText("가족 알림 토글"));
    expect(mockMutate).toHaveBeenCalledWith({ isFamilyReminderOn: true });

    fireEvent.press(getByLabelText("미복용 알림 토글"));
    expect(mockMutate).toHaveBeenCalledWith({ isMissedAlertOn: false });
  });

  it("설정 데이터가 없을 때만 토글을 비활성화한다", () => {
    mockSettings = undefined;
    const { getByLabelText, rerender } = render(<SettingsSection />);
    fireEvent.press(getByLabelText("복약 알림 토글"));
    expect(mockMutate).not.toHaveBeenCalled();

    mockSettings = { isMyReminderOn: true, isFamilyReminderOn: false, isMissedAlertOn: true };
    mockIsPending = true;
    rerender(<SettingsSection />);
    fireEvent.press(getByLabelText("복약 알림 토글"));
    expect(mockMutate).toHaveBeenCalledWith({ isMyReminderOn: false });
  });
});
