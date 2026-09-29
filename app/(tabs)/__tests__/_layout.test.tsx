import { render } from "@testing-library/react-native";
import TabLayout from "../_layout";

const mockRedirect = jest.fn<null, [{ href: string }]>(() => null);
const mockAuthGateView = jest.fn<
  null,
  [{ kind: "loading" | "error"; onRetry?: () => void; onLogout?: () => void }]
>(() => null);
const mockTabsScreen = jest.fn<null, [unknown]>(() => null);
const mockTabsProps = jest.fn<null, [unknown]>(() => null);
const mockRouterPush = jest.fn<unknown, unknown[]>();

let mockAuthState:
  | { kind: "loading" }
  | { kind: "error"; retry: () => void; logout: () => void }
  | { kind: "ready"; href: string };
let mockUser: { id: string } | null = { id: "user-1" };
let mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };

jest.mock("expo-router", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Tabs = (props: { children: React.ReactNode }) => {
    mockTabsProps(props);
    return React.createElement(View, {}, props.children);
  };
  Tabs.Screen = (props: unknown) => {
    mockTabsScreen(props);
    return null;
  };

  return {
    Redirect: (props: { href: string }) => mockRedirect(props),
    router: {
      push: (...args: unknown[]) => mockRouterPush(...args),
    },
    Tabs,
  };
});

jest.mock("@/hooks/useAuthRouteState", () => ({
  useAuthRouteState: () => mockAuthState,
}));

jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: { user: { id: string } | null }) => unknown) =>
    selector({ user: mockUser }),
}));

jest.mock("@/components/AuthGateView", () => ({
  AuthGateView: (props: {
    kind: "loading" | "error";
    onRetry?: () => void;
    onLogout?: () => void;
  }) => mockAuthGateView(props),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => mockInsets,
}));

describe("app/(tabs)/_layout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = { kind: "ready", href: "/(tabs)/dashboard" };
    mockUser = { id: "user-1" };
    mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
  });

  it("loading 상태면 AuthGateView loading을 렌더링한다", () => {
    mockAuthState = { kind: "loading" };
    render(<TabLayout />);

    expect(mockAuthGateView).toHaveBeenCalledWith({ kind: "loading" });
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("error 상태면 AuthGateView error를 렌더링한다", () => {
    const retry = jest.fn();
    const logout = jest.fn();
    mockAuthState = { kind: "error", retry, logout };
    render(<TabLayout />);

    expect(mockAuthGateView).toHaveBeenCalledWith({
      kind: "error",
      onRetry: retry,
      onLogout: logout,
    });
  });

  it("인증 라우트가 dashboard가 아니면 Redirect한다", () => {
    mockAuthState = { kind: "ready", href: "/(auth)" };
    render(<TabLayout />);

    expect(mockRedirect).toHaveBeenCalledWith({ href: "/(auth)" });
  });

  it("사용자 정보가 없으면 loading gate를 렌더링한다", () => {
    mockUser = null;
    render(<TabLayout />);

    expect(mockAuthGateView).toHaveBeenCalledWith({ kind: "loading" });
  });

  it("scan 탭 클릭 리스너가 기본 이벤트를 막고 상세 스캔 화면으로 이동한다", () => {
    render(<TabLayout />);
    const screenCall = mockTabsScreen.mock.calls.find(
      (call) => (call[0] as unknown as { name?: string })?.name === "scan",
    );
    const scanProps = screenCall?.[0] as unknown as {
      listeners?: { tabPress?: (event: { preventDefault: () => void }) => void };
    };
    const preventDefault = jest.fn();

    scanProps.listeners?.tabPress?.({ preventDefault });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith("/(detail)/scan/scan");
  });

  it("하단 시스템 인셋이 있으면 탭바 높이와 하단 패딩에 반영한다", () => {
    mockInsets = { top: 0, bottom: 34, left: 0, right: 0 };
    render(<TabLayout />);

    const tabsProps = mockTabsProps.mock.calls[0]?.[0] as unknown as {
      screenOptions: { tabBarStyle: { height: number; paddingBottom: number } };
    };

    expect(tabsProps.screenOptions.tabBarStyle.height).toBe(70 + 34);
    expect(tabsProps.screenOptions.tabBarStyle.paddingBottom).toBe(34);
  });
});
