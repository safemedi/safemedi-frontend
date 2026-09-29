import { render } from "@testing-library/react-native";
import AuthLayout from "../_layout";
import LoginRoute from "../login";
import TutorialRoute from "../tutorial";

const mockStackScreen = jest.fn<null, [unknown]>(() => null);
const mockLoginScreen = jest.fn(() => null);
const mockTutorialScreen = jest.fn(() => null);

jest.mock("expo-router", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Stack = ({ children }: { children: React.ReactNode }) =>
    React.createElement(View, {}, children);
  Stack.Screen = (props: unknown) => {
    mockStackScreen(props);
    return null;
  };
  return { Stack };
});

jest.mock("@/features/auth", () => ({
  LoginScreen: () => mockLoginScreen(),
}));

jest.mock("@/features/tutorial", () => ({
  TutorialScreen: () => mockTutorialScreen(),
}));

describe("app/(auth) routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("auth layout이 login/tutorial 스크린을 등록한다", () => {
    render(<AuthLayout />);

    const names = mockStackScreen.mock.calls
      .map((call) => (call[0] as unknown as { name?: string })?.name)
      .filter(Boolean);
    expect(names).toEqual(["login", "tutorial"]);
  });

  it("login route가 LoginScreen을 렌더링한다", () => {
    render(<LoginRoute />);
    expect(mockLoginScreen).toHaveBeenCalledTimes(1);
  });

  it("tutorial route가 TutorialScreen을 렌더링한다", () => {
    render(<TutorialRoute />);
    expect(mockTutorialScreen).toHaveBeenCalledTimes(1);
  });
});
