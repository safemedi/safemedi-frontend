import { fireEvent, render } from "@testing-library/react-native";
import { router } from "expo-router";
import { Alert } from "react-native";
import { InviteAcceptScreen } from "../InviteAcceptScreen";

jest.mock("ky", () => ({
  isHTTPError: (error: unknown) => Boolean((error as { __httpError?: boolean })?.__httpError),
}));

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  return {
    LinearGradient: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
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

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
  },
}));

const mockUseFamilyInvitation = jest.fn();
const mockUseAcceptFamilyInvitation = jest.fn();
const mockAcceptMutate = jest.fn();

jest.mock("@/api/queries/family", () => ({
  useFamilyInvitation: (token: string | null) => mockUseFamilyInvitation(token),
  useAcceptFamilyInvitation: () => mockUseAcceptFamilyInvitation(),
}));

describe("InviteAcceptScreen", () => {
  const mockAlert = jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
  const mockRouterReplace = router.replace as jest.MockedFunction<typeof router.replace>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFamilyInvitation.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { inviterName: "홍길동", expiresAt: "2026-07-16T06:00:00Z" },
      error: undefined,
    });
    mockUseAcceptFamilyInvitation.mockReturnValue({
      mutate: mockAcceptMutate,
      isPending: false,
    });
  });

  it("token이 없으면 잘못된 링크 문구와 홈 이동 버튼을 보여준다", () => {
    const { getByText, getByLabelText } = render(<InviteAcceptScreen token={null} />);

    expect(getByText("잘못된 초대 링크입니다.")).toBeTruthy();

    fireEvent.press(getByLabelText("홈으로 이동"));
    expect(mockRouterReplace).toHaveBeenCalledWith("/(tabs)/dashboard");
  });

  it("조회 중이면 로딩 문구를 보여준다", () => {
    mockUseFamilyInvitation.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
      error: undefined,
    });

    const { getByText } = render(<InviteAcceptScreen token="tok-1" />);

    expect(getByText("초대 정보를 확인하는 중입니다.")).toBeTruthy();
  });

  it("존재하지 않는 토큰이면 404 문구를 보여준다", () => {
    mockUseFamilyInvitation.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      error: { __httpError: true, response: { status: 404 } },
    });

    const { getByText } = render(<InviteAcceptScreen token="tok-2" />);

    expect(getByText("존재하지 않거나 유효하지 않은 초대 링크입니다.")).toBeTruthy();
  });

  it("만료된 토큰이면 410 문구를 보여준다", () => {
    mockUseFamilyInvitation.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      error: { __httpError: true, response: { status: 410 } },
    });

    const { getByText } = render(<InviteAcceptScreen token="tok-3" />);

    expect(getByText("만료된 초대 링크입니다.")).toBeTruthy();
  });

  it("정상 초대이면 초대자 이름과 수락/거절 버튼을 보여준다", () => {
    const { getByText, getByLabelText } = render(<InviteAcceptScreen token="tok-4" />);

    expect(getByText("홍길동님이\n가족으로 초대했어요")).toBeTruthy();
    expect(getByLabelText("가족 초대 수락")).toBeTruthy();
    expect(getByLabelText("가족 초대 거절")).toBeTruthy();
  });

  it("수락 버튼 클릭 시 초대를 수락하고 가족 관리 화면으로 이동한다", () => {
    const { getByLabelText } = render(<InviteAcceptScreen token="tok-5" />);

    fireEvent.press(getByLabelText("가족 초대 수락"));
    expect(mockAcceptMutate).toHaveBeenCalledWith("tok-5", expect.any(Object));

    const { onSuccess } = mockAcceptMutate.mock.calls[0][1];
    onSuccess();

    expect(mockAlert).toHaveBeenCalledWith("수락 완료", "가족 초대를 수락했어요.");
    expect(mockRouterReplace).toHaveBeenCalledWith("/(detail)/family/manage");
  });

  it("거절 버튼 클릭 시 확인 알림을 띄우고 확인하면 대시보드로 이동한다", () => {
    const { getByLabelText } = render(<InviteAcceptScreen token="tok-6" />);

    fireEvent.press(getByLabelText("가족 초대 거절"));

    expect(mockAlert).toHaveBeenCalledWith(
      "초대 거절",
      "이 초대를 거절하시겠어요?",
      expect.any(Array),
    );

    const buttons = mockAlert.mock.calls[0][2] as Array<{ text: string; onPress?: () => void }>;
    buttons.find((button) => button.text === "거절")?.onPress?.();

    expect(mockRouterReplace).toHaveBeenCalledWith("/(tabs)/dashboard");
  });

  it("수락 처리 중이면 버튼이 비활성화되고 수락 중 문구를 보여준다", () => {
    mockUseAcceptFamilyInvitation.mockReturnValue({
      mutate: mockAcceptMutate,
      isPending: true,
    });

    const { getByText, getByLabelText } = render(<InviteAcceptScreen token="tok-7" />);

    expect(getByText("수락 중")).toBeTruthy();

    fireEvent.press(getByLabelText("가족 초대 수락"));
    expect(mockAcceptMutate).not.toHaveBeenCalled();
  });
});
