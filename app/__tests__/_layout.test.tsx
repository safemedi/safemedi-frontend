import * as Sentry from "@sentry/react-native";
import { render } from "@testing-library/react-native";

jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  wrap: (Component: unknown) => Component,
  expoRouterIntegration: () => ({}),
}));

import RootLayout, { unstable_settings } from "../_layout";

type SentryBreadcrumb = { data?: Record<string, unknown> };
type SentryInitConfig = { beforeBreadcrumb: (breadcrumb: SentryBreadcrumb) => SentryBreadcrumb };

// clearAllMocks가 실행되기 전, 모듈 로드 시 한 번 호출된 Sentry.init 인자를 미리 캡처해둔다.
const sentryInitConfig = (Sentry.init as jest.Mock).mock.calls[0]?.[0] as SentryInitConfig;

const mockStackScreen = jest.fn<null, [unknown]>(() => null);
const mockProfileSync = jest.fn(() => null);

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

jest.mock("@/components/ProfileSync", () => ({
  ProfileSync: () => mockProfileSync(),
}));

jest.mock("tamagui", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    TamaguiProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, {}, children),
  };
});

jest.mock("../../tamagui.config", () => ({
  tamaguiConfig: {},
}));

describe("app/_layout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("앱 루트 설정(anchor)을 유지한다", () => {
    expect(unstable_settings.anchor).toBe("index");
  });

  it("ProfileSync와 주요 Stack.Screen 구성을 렌더링한다", () => {
    render(<RootLayout />);

    expect(mockProfileSync).toHaveBeenCalledTimes(1);

    const names = mockStackScreen.mock.calls
      .map((call) => (call[0] as unknown as { name?: string })?.name)
      .filter(Boolean);
    expect(names).toEqual(["index", "(auth)", "(tabs)", "(detail)"]);
  });

  it("Sentry beforeBreadcrumb가 breadcrumb의 url 토큰·query string을 redact한다", () => {
    const breadcrumb: SentryBreadcrumb = {
      data: { url: "https://api.example.com/api/v1/family-invitations/tok3n/accept?ref=x" },
    };

    const result = sentryInitConfig.beforeBreadcrumb(breadcrumb);

    expect(result.data?.url).toBe(
      "https://api.example.com/api/v1/family-invitations/[redacted]/accept",
    );
  });

  it("Sentry beforeBreadcrumb가 url이 없는 breadcrumb는 그대로 반환한다", () => {
    const breadcrumb: SentryBreadcrumb = { data: { category: "navigation" } };

    const result = sentryInitConfig.beforeBreadcrumb(breadcrumb);

    expect(result).toBe(breadcrumb);
  });
});
