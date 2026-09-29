import { render } from "@testing-library/react-native";
import IndexRedirect from "../index";

let mockAuthState:
  | { kind: "loading" }
  | { kind: "error"; retry: () => void; logout: () => void }
  | { kind: "ready"; href: string };

const mockRedirect = jest.fn<null, [{ href: string }]>(() => null);
const mockAuthGateView = jest.fn<
  null,
  [{ kind: "loading" | "error"; onRetry?: () => void; onLogout?: () => void }]
>(() => null);

jest.mock("expo-router", () => ({
  Redirect: (props: { href: string }) => mockRedirect(props),
}));

jest.mock("@/hooks/useAuthRouteState", () => ({
  useAuthRouteState: () => mockAuthState,
}));

jest.mock("@/components/AuthGateView", () => ({
  AuthGateView: (props: {
    kind: "loading" | "error";
    onRetry?: () => void;
    onLogout?: () => void;
  }) => mockAuthGateView(props),
}));

describe("app/index", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loading 상태면 AuthGateView loading을 렌더링한다", () => {
    mockAuthState = { kind: "loading" };
    render(<IndexRedirect />);

    expect(mockAuthGateView).toHaveBeenCalledWith({ kind: "loading" });
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("error 상태면 AuthGateView error를 렌더링한다", () => {
    const retry = jest.fn();
    const logout = jest.fn();
    mockAuthState = { kind: "error", retry, logout };
    render(<IndexRedirect />);

    expect(mockAuthGateView).toHaveBeenCalledWith({
      kind: "error",
      onRetry: retry,
      onLogout: logout,
    });
  });

  it("ready 상태면 href로 Redirect한다", () => {
    mockAuthState = { kind: "ready", href: "/(tabs)/dashboard" };
    render(<IndexRedirect />);

    expect(mockRedirect).toHaveBeenCalledWith({ href: "/(tabs)/dashboard" });
  });
});
