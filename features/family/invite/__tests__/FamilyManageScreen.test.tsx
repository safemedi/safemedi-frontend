import { fireEvent, render, waitFor } from "@testing-library/react-native";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { Alert, Share } from "react-native";
import type { FamilySummary } from "@/api/types";
import { FamilyManageScreen } from "../FamilyManageScreen";

interface MockFamilyInviteCardProps {
  readonly inviteLink: string;
  readonly onCopyLink?: () => void | Promise<void>;
  readonly onShareLink?: () => void | Promise<void>;
}

interface MockFamilyManageHeaderProps {
  readonly onBack?: () => void;
}

interface MockFamilyMembersSectionProps {
  readonly members: readonly FamilySummary[];
  readonly editingFamilyId: number | null;
  readonly onStartEdit: (familyId: number) => void;
  readonly onUnlink: (familyId: number) => void;
  readonly onChangeRelationDraft: (text: string) => void;
  readonly onSaveRelation: () => void;
}

const mockMutate = jest.fn();
const mockUseFamilies = jest.fn();
const mockUseCreateFamilyInvitation = jest.fn();
const mockUseUpdateFamilyRelation = jest.fn();
const mockUseDeleteFamily = jest.fn();
const mockUpdateRelationMutate = jest.fn();
const mockDeleteFamilyMutate = jest.fn();

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
  const { View } = require("react-native");
  return {
    YStack: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
  },
}));

jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(),
}));

jest.mock("@/api/queries/family", () => ({
  useCreateFamilyInvitation: () => mockUseCreateFamilyInvitation(),
  useFamilies: () => mockUseFamilies(),
  useUpdateFamilyRelation: () => mockUseUpdateFamilyRelation(),
  useDeleteFamily: () => mockUseDeleteFamily(),
}));

jest.mock("../components/FamilyFeatureBanner", () => ({
  FamilyFeatureBanner: () => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, null, "패밀리 배너");
  },
}));

jest.mock("../components/FamilyManageHeader", () => ({
  FamilyManageHeader: ({ onBack }: MockFamilyManageHeaderProps) => {
    const React = require("react");
    const { Pressable, Text } = require("react-native");
    return React.createElement(
      Pressable,
      { onPress: onBack, accessibilityRole: "button", accessibilityLabel: "가족관리 뒤로가기" },
      React.createElement(Text, null, "가족 관리 헤더"),
    );
  },
}));

jest.mock("../components/FamilyInviteCard", () => ({
  FamilyInviteCard: ({ inviteLink, onCopyLink, onShareLink }: MockFamilyInviteCardProps) => {
    const React = require("react");
    const { Pressable, Text, View } = require("react-native");
    return React.createElement(
      View,
      null,
      React.createElement(Text, null, inviteLink),
      React.createElement(
        Pressable,
        { onPress: onCopyLink, accessibilityRole: "button", accessibilityLabel: "링크 복사" },
        React.createElement(Text, null, "복사"),
      ),
      React.createElement(
        Pressable,
        { onPress: onShareLink, accessibilityRole: "button", accessibilityLabel: "링크 공유" },
        React.createElement(Text, null, "공유"),
      ),
    );
  },
}));

jest.mock("../components/FamilyMembersSection", () => ({
  FamilyMembersSection: ({
    members,
    editingFamilyId,
    onStartEdit,
    onUnlink,
    onChangeRelationDraft,
    onSaveRelation,
  }: MockFamilyMembersSectionProps) => {
    const React = require("react");
    const { Pressable, Text, View } = require("react-native");
    return React.createElement(
      View,
      null,
      React.createElement(Text, null, `구성원:${members.length}`),
      React.createElement(Text, null, `편집중:${editingFamilyId ?? "없음"}`),
      React.createElement(
        Pressable,
        {
          onPress: () => onStartEdit(2),
          accessibilityRole: "button",
          accessibilityLabel: "호칭 수정 트리거",
        },
        React.createElement(Text, null, "호칭 수정 트리거"),
      ),
      React.createElement(
        Pressable,
        {
          onPress: () => onUnlink(2),
          accessibilityRole: "button",
          accessibilityLabel: "연동 해제 트리거",
        },
        React.createElement(Text, null, "연동 해제 트리거"),
      ),
      React.createElement(
        Pressable,
        {
          onPress: () => onChangeRelationDraft("엄마"),
          accessibilityRole: "button",
          accessibilityLabel: "호칭 입력 트리거",
        },
        React.createElement(Text, null, "호칭 입력 트리거"),
      ),
      React.createElement(
        Pressable,
        {
          onPress: onSaveRelation,
          accessibilityRole: "button",
          accessibilityLabel: "호칭 저장 트리거",
        },
        React.createElement(Text, null, "호칭 저장 트리거"),
      ),
    );
  },
}));

describe("FamilyManageScreen", () => {
  const mockAlert = jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
  const mockShare = jest.spyOn(Share, "share");
  const mockSetStringAsync = Clipboard.setStringAsync as jest.MockedFunction<
    typeof Clipboard.setStringAsync
  >;
  const mockRouterBack = router.back as jest.MockedFunction<typeof router.back>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFamilies.mockReturnValue({
      data: [
        { familyId: null, name: "홍길동", relation: "본인" },
        { familyId: 2, name: "김영희", relation: "어머니" },
      ],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    mockUseCreateFamilyInvitation.mockReturnValue({
      data: { inviteUrl: "https://safemedi.app/invite/abc" },
      isIdle: false,
      isPending: false,
      isError: false,
      mutate: mockMutate,
    });
    mockUseUpdateFamilyRelation.mockReturnValue({
      mutate: mockUpdateRelationMutate,
      isPending: false,
    });
    mockUseDeleteFamily.mockReturnValue({
      mutate: mockDeleteFamilyMutate,
      isPending: false,
      variables: undefined,
    });
    mockShare.mockResolvedValue({ action: "sharedAction" });
    mockSetStringAsync.mockResolvedValue(true);
  });

  it("조회 데이터와 초대 링크가 화면에 반영된다", () => {
    const { getByText } = render(<FamilyManageScreen />);

    expect(getByText("패밀리 배너")).toBeTruthy();
    expect(getByText("https://safemedi.app/invite/abc")).toBeTruthy();
    expect(getByText("구성원:2")).toBeTruthy();
  });

  it("초대 mutation이 idle이면 링크 생성을 요청한다", () => {
    mockUseCreateFamilyInvitation.mockReturnValue({
      data: undefined,
      isIdle: true,
      isPending: false,
      isError: false,
      mutate: mockMutate,
    });

    render(<FamilyManageScreen />);

    expect(mockMutate).toHaveBeenCalledTimes(1);
  });

  it("링크 복사 버튼 클릭 시 클립보드 복사 후 성공 알림을 띄운다", async () => {
    const { getByLabelText } = render(<FamilyManageScreen />);

    fireEvent.press(getByLabelText("링크 복사"));

    await waitFor(() => {
      expect(mockSetStringAsync).toHaveBeenCalledWith("https://safemedi.app/invite/abc");
    });
    expect(mockAlert).toHaveBeenCalledWith("복사 완료", "초대 링크를 클립보드에 복사했어요.");
  });

  it("공유 버튼 클릭 시 공유 시트를 연다", async () => {
    const { getByLabelText } = render(<FamilyManageScreen />);

    fireEvent.press(getByLabelText("링크 공유"));

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith({
        message: "https://safemedi.app/invite/abc",
        url: "https://safemedi.app/invite/abc",
      });
    });
  });

  it("뒤로가기 버튼 클릭 시 라우터 back을 호출한다", () => {
    const { getByLabelText } = render(<FamilyManageScreen />);

    fireEvent.press(getByLabelText("가족관리 뒤로가기"));

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });

  it("초대 링크가 비어 있으면 복사/공유를 호출하지 않는다", async () => {
    mockUseCreateFamilyInvitation.mockReturnValue({
      data: undefined,
      isIdle: false,
      isPending: false,
      isError: true,
      mutate: mockMutate,
    });

    const { getByLabelText } = render(<FamilyManageScreen />);
    fireEvent.press(getByLabelText("링크 복사"));
    fireEvent.press(getByLabelText("링크 공유"));

    await waitFor(() => {
      expect(mockSetStringAsync).not.toHaveBeenCalled();
      expect(mockShare).not.toHaveBeenCalled();
    });
  });

  it("호칭 수정을 시작하면 해당 familyId가 편집 상태가 된다", () => {
    const { getByText, getByLabelText } = render(<FamilyManageScreen />);

    fireEvent.press(getByLabelText("호칭 수정 트리거"));

    expect(getByText("편집중:2")).toBeTruthy();
  });

  it("호칭 저장 시 수정된 값으로 mutation을 호출한다", () => {
    const { getByLabelText } = render(<FamilyManageScreen />);

    fireEvent.press(getByLabelText("호칭 수정 트리거"));
    fireEvent.press(getByLabelText("호칭 입력 트리거"));
    fireEvent.press(getByLabelText("호칭 저장 트리거"));

    expect(mockUpdateRelationMutate).toHaveBeenCalledWith(
      { familyId: 2, body: { relation: "엄마" } },
      expect.any(Object),
    );

    const { onSuccess } = mockUpdateRelationMutate.mock.calls[0][1];
    onSuccess();
    expect(mockAlert).toHaveBeenCalledWith("호칭 수정 완료", "가족 호칭을 수정했어요.");
  });

  it("연동 해제 트리거 시 확인 알림을 띄우고 확인하면 mutation을 호출한다", () => {
    const { getByLabelText } = render(<FamilyManageScreen />);

    fireEvent.press(getByLabelText("연동 해제 트리거"));

    expect(mockAlert).toHaveBeenCalledWith(
      "가족 연동 해제",
      "이 가족과의 연동을 해제하시겠습니까?",
      expect.any(Array),
    );

    const buttons = mockAlert.mock.calls[0][2] as Array<{ text: string; onPress?: () => void }>;
    buttons.find((button) => button.text === "해제")?.onPress?.();

    expect(mockDeleteFamilyMutate).toHaveBeenCalledWith(2, expect.any(Object));

    const { onSuccess } = mockDeleteFamilyMutate.mock.calls[0][1];
    onSuccess();
    expect(mockAlert).toHaveBeenCalledWith("연동 해제 완료", "가족 연동을 해제했어요.");
  });
});
