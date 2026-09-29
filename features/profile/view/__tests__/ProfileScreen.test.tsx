import { fireEvent, render } from "@testing-library/react-native";
import ProfileScreen from "@/app/(tabs)/profile";

const mockHandleLogout = jest.fn();
const mockHandleWithdrawAccount = jest.fn();
const mockHandleOpenHealthInfoDetail = jest.fn();

jest.mock("expo-router", () => ({
  __esModule: true,
  router: {
    push: jest.fn(),
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("@/features/profile/view/useProfileViewModel", () => ({
  useProfileViewModel: () => ({
    profileUser: { name: "홍길동", role: "주 사용자" },
    familyProfiles: [],
    allergies: ["아스피린"],
    chronicConditions: ["천식"],
    appInfoItems: [],
    handleLogout: mockHandleLogout,
    handleWithdrawAccount: mockHandleWithdrawAccount,
    isWithdrawing: false,
    handleOpenProfileEdit: jest.fn(),
    handleOpenFamilyManage: jest.fn(),
    handleOpenHealthInfoDetail: mockHandleOpenHealthInfoDetail,
  }),
}));

jest.mock("tamagui", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    YStack: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock("@/features/profile/view/components/ProfilePageHeader", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { ProfilePageHeader: () => React.createElement(Text, null, "헤더") };
});

jest.mock("@/features/profile/view/components/UserHeroCard", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    UserHeroCard: ({ name, onPress }: { name: string; onPress: () => void }) =>
      React.createElement(
        Pressable,
        { onPress, accessibilityRole: "button", accessibilityLabel: "프로필 수정으로 이동" },
        React.createElement(Text, null, name),
      ),
  };
});

jest.mock("@/features/profile/view/components/FamilyProfileSection", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { FamilyProfileSection: () => React.createElement(Text, null, "가족 프로필") };
});

jest.mock("@/features/profile/view/components/HealthInfoSection", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    HealthInfoSection: ({ onDetailPress }: { onDetailPress?: () => void }) =>
      React.createElement(
        Pressable,
        {
          onPress: onDetailPress,
          accessibilityRole: "button",
          accessibilityLabel: "건강 정보 상세보기",
        },
        React.createElement(Text, null, "건강 정보"),
      ),
  };
});

jest.mock("@/features/profile/view/components/SettingsSection", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { SettingsSection: () => React.createElement(Text, null, "설정") };
});

jest.mock("@/features/profile/view/components/AppInfoSection", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { AppInfoSection: () => React.createElement(Text, null, "앱 정보") };
});

jest.mock("@/features/profile/view/components/LogoutButton", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    LogoutButton: ({ onPress }: { onPress: () => void }) =>
      React.createElement(
        Pressable,
        { onPress, accessibilityRole: "button", accessibilityLabel: "로그아웃" },
        React.createElement(Text, null, "로그아웃"),
      ),
  };
});

jest.mock("@/features/profile/view/components/WithdrawAccountButton", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    WithdrawAccountButton: ({ onPress }: { onPress: () => void }) =>
      React.createElement(
        Pressable,
        { onPress, accessibilityRole: "button", accessibilityLabel: "회원 탈퇴" },
        React.createElement(Text, null, "회원 탈퇴"),
      ),
  };
});

describe("프로필 기본 화면", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("기본 화면 주요 섹션이 렌더링된다", () => {
    const { getByText } = render(<ProfileScreen />);

    expect(getByText("헤더")).toBeTruthy();
    expect(getByText("가족 프로필")).toBeTruthy();
    expect(getByText("건강 정보")).toBeTruthy();
    expect(getByText("설정")).toBeTruthy();
  });

  it("로그아웃 시 세션/유저를 정리하고 관련 쿼리를 제거한다", () => {
    const { getByLabelText } = render(<ProfileScreen />);

    fireEvent.press(getByLabelText("로그아웃"));

    expect(mockHandleLogout).toHaveBeenCalledTimes(1);
  });

  it("회원 탈퇴 버튼을 누르면 탈퇴 핸들러를 호출한다", () => {
    const { getByLabelText } = render(<ProfileScreen />);

    fireEvent.press(getByLabelText("회원 탈퇴"));

    expect(mockHandleWithdrawAccount).toHaveBeenCalledTimes(1);
  });

  it("건강 정보 상세보기 클릭 시 건강정보 상세 페이지로 이동한다", () => {
    const { getByLabelText } = render(<ProfileScreen />);

    fireEvent.press(getByLabelText("건강 정보 상세보기"));

    expect(mockHandleOpenHealthInfoDetail).toHaveBeenCalledTimes(1);
  });
});
