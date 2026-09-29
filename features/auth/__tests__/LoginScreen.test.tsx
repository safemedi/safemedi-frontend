import { fireEvent, render } from "@testing-library/react-native";
import { LoginScreen } from "../LoginScreen";

const mockHandleKakaoLogin = jest.fn();
const mockRetry = jest.fn();

let mockAuthState:
  | { kind: "loading" }
  | { kind: "error"; retry: () => void; logout: () => void }
  | { kind: "redirect"; href: "/(auth)/login" | "/(tabs)/dashboard" } = {
  kind: "redirect",
  href: "/(auth)/login",
};

jest.mock("expo-router", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Redirect: ({ href }: { href: string }) => React.createElement(Text, null, `redirect:${href}`),
  };
});

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LinearGradient: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock("tamagui", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    YStack: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock("@/components/AuthGateView", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    AuthGateView: ({ kind, onRetry }: { kind: string; onRetry?: () => void }) =>
      React.createElement(
        Pressable,
        { accessibilityLabel: `auth-${kind}`, onPress: onRetry },
        React.createElement(Text, null, kind),
      ),
  };
});

jest.mock("@/hooks/useAuthRouteState", () => ({
  useAuthRouteState: () => mockAuthState,
}));

let mockIsLoggingIn = false;

jest.mock("../useLoginViewModel", () => ({
  useLoginViewModel: () => ({
    isLoggingIn: mockIsLoggingIn,
    handleKakaoLogin: mockHandleKakaoLogin,
  }),
}));

describe("LoginScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = { kind: "redirect", href: "/(auth)/login" };
    mockIsLoggingIn = false;
  });

  it("loading 상태에서는 AuthGateView를 렌더링한다", () => {
    mockAuthState = { kind: "loading" };
    const { getByLabelText } = render(<LoginScreen />);
    expect(getByLabelText("auth-loading")).toBeTruthy();
  });

  it("error 상태에서는 retry를 전달한다", () => {
    mockAuthState = { kind: "error", retry: mockRetry, logout: jest.fn() };
    const { getByLabelText } = render(<LoginScreen />);
    fireEvent.press(getByLabelText("auth-error"));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it("로그인 화면이 아닌 redirect 상태이면 Redirect를 렌더링한다", () => {
    mockAuthState = { kind: "redirect", href: "/(tabs)/dashboard" };
    const { getByText } = render(<LoginScreen />);
    expect(getByText("redirect:/(tabs)/dashboard")).toBeTruthy();
  });

  it("카카오 로그인 버튼 클릭 시 handleKakaoLogin을 호출한다", () => {
    const { getByLabelText } = render(<LoginScreen />);
    fireEvent.press(getByLabelText("카카오 소셜로그인"));
    expect(mockHandleKakaoLogin).toHaveBeenCalledTimes(1);
  });

  it("로그인 진행 중에는 버튼 대신 로딩 스피너를 표시한다", () => {
    mockIsLoggingIn = true;
    const { getByLabelText, queryByLabelText } = render(<LoginScreen />);
    expect(getByLabelText("로그인 진행 중")).toBeTruthy();
    expect(queryByLabelText("카카오 소셜로그인")).toBeNull();
  });
});
