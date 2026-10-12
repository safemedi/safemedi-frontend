import { fireEvent, render } from "@testing-library/react-native";
import ProfileScreen from "@/app/(tabs)/profile";

let mockFamiliesError = false;
let mockSettingsError = false;
let mockFamiliesLoading = false;
const mockRetryFamilies = jest.fn();
const mockRetrySettings = jest.fn();
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
    isFamiliesError: mockFamiliesError,
    isSettingsError: mockSettingsError,
    isFamiliesLoading: mockFamiliesLoading,
    isSettingsLoading: false,
    handleRetryFamilies: mockRetryFamilies,
    handleRetrySettings: mockRetrySettings,
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
    mockFamiliesError = false;
    mockSettingsError = false;
    mockFamiliesLoading = false;
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
  it.each([
    [true, false],
    [false, true],
    [true, true],
  ])("실패한 영역만 오류를 표시하고 건강정보와 로그아웃을 유지한다 (%s, %s)", (familiesError, settingsError) => {
    mockFamiliesError = familiesError;
    mockSettingsError = settingsError;
    const screen = render(<ProfileScreen />);
    expect(screen.queryByText("가족 프로필") !== null).toBe(!familiesError);
    expect(screen.queryByText("설정") !== null).toBe(!settingsError);
    if (familiesError) {
      fireEvent.press(screen.getByLabelText("가족 정보 다시 시도"));
      expect(mockRetryFamilies).toHaveBeenCalledTimes(1);
    }
    if (settingsError) {
      fireEvent.press(screen.getByLabelText("알림 설정 정보 다시 시도"));
      expect(mockRetrySettings).toHaveBeenCalledTimes(1);
    }
    fireEvent.press(screen.getByLabelText("로그아웃"));
    fireEvent.press(screen.getByLabelText("건강 정보 상세보기"));
    expect(mockHandleLogout).toHaveBeenCalledTimes(1);
    expect(mockHandleOpenHealthInfoDetail).toHaveBeenCalledTimes(1);
  });

  it("영역 재시도 중에도 다른 영역을 유지하고 성공하면 해당 영역을 복구한다", () => {
    mockFamiliesLoading = true;
    const screen = render(<ProfileScreen />);
    expect(screen.getByText("가족 정보를 다시 불러오는 중입니다.")).toBeTruthy();
    expect(screen.getByText("설정")).toBeTruthy();
    expect(screen.getByLabelText("로그아웃")).toBeTruthy();
    mockFamiliesLoading = false;
    screen.rerender(<ProfileScreen />);
    expect(screen.getByText("가족 프로필")).toBeTruthy();
  });
});
