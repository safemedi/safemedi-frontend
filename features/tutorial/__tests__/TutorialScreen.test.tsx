import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import type { User } from "@/stores/userStore";
import { TutorialScreen } from "../TutorialScreen";

const mockRouterReplace = jest.fn();
const mockRetry = jest.fn();
const mockMutateAsync = jest.fn();
const mockParseApiError = jest.fn();

let mockAuthState:
  | { kind: "loading" }
  | { kind: "error"; retry: () => void; logout: () => void }
  | { kind: "redirect"; href: "/(auth)/tutorial" | "/(auth)/login" | "/(tabs)/dashboard" } = {
  kind: "redirect",
  href: "/(auth)/tutorial",
};

let mockUser: User | null = {
  id: "me",
  displayName: "유저",
  email: null,
  birthDate: "1999-01-01",
  height: 170,
  weight: 60,
  gender: "female",
  bloodType: "A+",
  allergies: [],
  chronicConditions: [],
  isTutorial: false,
};

const stepSubmitByLabel: Record<string, () => Promise<boolean>> = {
  Step1: async () => true,
  Step2: async () => true,
  Step3: async () => true,
  Step4: async () => true,
};

jest.mock("expo-router", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Redirect: ({ href }: { href: string }) => React.createElement(Text, null, `redirect:${href}`),
    useRouter: () => ({ replace: mockRouterReplace }),
  };
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

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
  const { Text, View } = require("react-native");
  return {
    Text: ({ children }: { children: React.ReactNode }) =>
      React.createElement(Text, null, children),
    XStack: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
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
        { onPress: onRetry, accessibilityLabel: `auth-gate-${kind}` },
        React.createElement(Text, null, kind),
      ),
  };
});

jest.mock("@/components/ui/PillButton", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    PillButton: ({
      children,
      onPress,
      accessibilityLabel,
      disabled,
    }: {
      children: React.ReactNode;
      onPress?: () => void;
      accessibilityLabel?: string;
      disabled?: boolean;
    }) =>
      React.createElement(
        Pressable,
        { onPress, disabled, accessibilityLabel },
        typeof children === "string" ? React.createElement(Text, null, children) : children,
      ),
  };
});

jest.mock("@/components/ui/SegmentedStepProgress", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    SegmentedStepProgress: ({ currentIndex }: { currentIndex: number }) =>
      React.createElement(Text, null, `progress:${currentIndex}`),
  };
});

jest.mock("@/hooks/useAuthRouteState", () => ({
  useAuthRouteState: () => mockAuthState,
}));

jest.mock("@/stores/userStore", () => {
  const useUserStore = (selector: (state: { user: User | null }) => unknown): unknown =>
    selector({ user: mockUser });
  useUserStore.getState = () => ({ user: mockUser });
  return { useUserStore };
});

jest.mock("@/api/queries/user", () => ({
  useCompleteTutorialMutation: () => ({
    mutateAsync: (...args: unknown[]) => mockMutateAsync(...args),
    isPending: false,
  }),
}));

jest.mock("@/utils/user-mapper", () => ({
  userToTutorialRegistrationBody: () => ({ birthDate: "1999-01-01" }),
}));

jest.mock("@/api/error", () => ({
  getApiErrorMessage: (...args: unknown[]) => mockParseApiError(...args),
}));

function mockCreateStep(label: "Step1" | "Step2" | "Step3" | "Step4") {
  const React = require("react");
  const { Text } = require("react-native");
  return React.forwardRef((_props: unknown, ref: React.Ref<{ submit: () => Promise<boolean> }>) => {
    React.useImperativeHandle(ref, () => ({ submit: stepSubmitByLabel[label] }));
    return React.createElement(Text, null, label);
  });
}

jest.mock("../components/Step1", () => ({ Step1: mockCreateStep("Step1") }));
jest.mock("../components/Step2", () => ({ Step2: mockCreateStep("Step2") }));
jest.mock("../components/Step3", () => ({ Step3: mockCreateStep("Step3") }));
jest.mock("../components/Step4", () => ({ Step4: mockCreateStep("Step4") }));

describe("TutorialScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = { kind: "redirect", href: "/(auth)/tutorial" };
    mockUser = {
      id: "me",
      displayName: "유저",
      email: null,
      birthDate: "1999-01-01",
      height: 170,
      weight: 60,
      gender: "female",
      bloodType: "A+",
      allergies: [],
      chronicConditions: [],
      isTutorial: false,
    };
    stepSubmitByLabel.Step1 = async () => true;
    stepSubmitByLabel.Step2 = async () => true;
    stepSubmitByLabel.Step3 = async () => true;
    stepSubmitByLabel.Step4 = async () => true;
    mockMutateAsync.mockResolvedValue({});
    mockParseApiError.mockResolvedValue("튜토리얼 저장 실패");
  });

  it("auth loading 상태면 AuthGateView를 표시한다", () => {
    mockAuthState = { kind: "loading" };
    const { getByLabelText } = render(<TutorialScreen />);
    expect(getByLabelText("auth-gate-loading")).toBeTruthy();
  });

  it("auth error 상태에서 재시도 동작을 전달한다", () => {
    mockAuthState = { kind: "error", retry: mockRetry, logout: jest.fn() };
    const { getByLabelText } = render(<TutorialScreen />);
    fireEvent.press(getByLabelText("auth-gate-error"));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it("튜토리얼 경로가 아니면 Redirect를 렌더링한다", () => {
    mockAuthState = { kind: "redirect", href: "/(tabs)/dashboard" };
    const { getByText } = render(<TutorialScreen />);
    expect(getByText("redirect:/(tabs)/dashboard")).toBeTruthy();
  });

  it("유저가 없으면 로딩 게이트를 유지한다", () => {
    mockUser = null;
    const { getByLabelText } = render(<TutorialScreen />);
    expect(getByLabelText("auth-gate-loading")).toBeTruthy();
  });

  it("다음 버튼을 누르면 다음 단계로 진행한다", async () => {
    const { getByLabelText, getByText } = render(<TutorialScreen />);

    expect(getByText("Step1")).toBeTruthy();
    await act(async () => {
      fireEvent.press(getByLabelText("다음 단계"));
    });

    await waitFor(() => {
      expect(getByText("Step2")).toBeTruthy();
    });
  });

  it("마지막 단계 완료 시 튜토리얼 저장 후 대시보드로 이동한다", async () => {
    const { getByLabelText } = render(<TutorialScreen />);

    await act(async () => {
      fireEvent.press(getByLabelText("다음 단계"));
    });
    await waitFor(() => {
      expect(getByLabelText("다음 단계")).toBeTruthy();
    });
    await act(async () => {
      fireEvent.press(getByLabelText("다음 단계"));
    });
    await waitFor(() => {
      expect(getByLabelText("다음 단계")).toBeTruthy();
    });
    await act(async () => {
      fireEvent.press(getByLabelText("다음 단계"));
    });
    await waitFor(() => {
      expect(getByLabelText("튜토리얼 완료")).toBeTruthy();
    });
    await act(async () => {
      fireEvent.press(getByLabelText("튜토리얼 완료"));
    });

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
      expect(mockRouterReplace).toHaveBeenCalledWith("/(tabs)/dashboard");
    });
  });

  it("마지막 단계 저장 실패 시 파싱된 메시지로 Alert를 노출한다", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    mockMutateAsync.mockRejectedValue(new Error("save failed"));

    const { getByLabelText } = render(<TutorialScreen />);

    await act(async () => {
      fireEvent.press(getByLabelText("다음 단계"));
    });
    await act(async () => {
      fireEvent.press(getByLabelText("다음 단계"));
    });
    await act(async () => {
      fireEvent.press(getByLabelText("다음 단계"));
    });
    await waitFor(() => {
      expect(getByLabelText("튜토리얼 완료")).toBeTruthy();
    });
    await act(async () => {
      fireEvent.press(getByLabelText("튜토리얼 완료"));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("오류", "튜토리얼 저장 실패");
    });
    alertSpy.mockRestore();
  });
});
