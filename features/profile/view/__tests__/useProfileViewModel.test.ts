import { act, renderHook } from "@testing-library/react-native";
import { router } from "expo-router";
import { Alert } from "react-native";

import { useProfileViewModel } from "../useProfileViewModel";

let mockFamiliesLoading = false;
let mockSettingsLoading = false;
const mockFamiliesRefetch = jest.fn();
const mockSettingsRefetch = jest.fn();
const mockMutate = jest.fn();
const mockHandleLogout = jest.fn(async () => {});
const mockUseDeleteUserAccountMutation = jest.fn((_options: unknown) => ({
  mutate: mockMutate,
  isPending: false,
}));

jest.mock("@/api/queries/profile", () => ({
  useFamilyProfiles: () => ({
    data: [],
    isLoading: mockFamiliesLoading,
    isError: false,
    refetch: mockFamiliesRefetch,
  }),
  useNotificationSettings: () => ({
    data: {},
    isLoading: mockSettingsLoading,
    isError: false,
    refetch: mockSettingsRefetch,
  }),
}));

jest.mock("@/api/queries/user", () => ({
  useDeleteUserAccountMutation: (options: unknown) => mockUseDeleteUserAccountMutation(options),
}));

jest.mock("@/hooks/useLogout", () => ({
  useLogout: () => mockHandleLogout,
}));

jest.mock("@/stores/userStore", () => ({
  useProfileUser: () => ({ name: "홍길동", role: "주 사용자" }),
  useHealthInfo: () => ({ allergies: [], chronicConditions: [] }),
}));

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

describe("useProfileViewModel", () => {
  beforeEach(() => {
    mockFamiliesLoading = false;
    mockSettingsLoading = false;
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("가족 선택 시 해당 가족의 오늘 복약 화면으로 이동한다", () => {
    const { result } = renderHook(() => useProfileViewModel());
    act(() =>
      result.current.handleOpenFamilyMedication({
        id: "12",
        name: "김영희",
        relation: "어머니",
        isActive: false,
        avatarGradient: ["green", "green"],
      }),
    );
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/family/today-medications",
      params: { familyId: "12", name: "김영희", relation: "어머니" },
    });
  });

  it("본인 프로필은 가족 조회 화면으로 이동하지 않는다", () => {
    const { result } = renderHook(() => useProfileViewModel());
    act(() => result.current.handleOpenFamilyMedication(result.current.familyProfiles[0]));
    expect(router.push).not.toHaveBeenCalled();
  });

  it("회원 탈퇴 확인 후 API를 호출한다", () => {
    const { result } = renderHook(() => useProfileViewModel());

    act(() => {
      result.current.handleWithdrawAccount();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "회원 탈퇴",
      expect.stringContaining("복구할 수 없습니다"),
      expect.any(Array),
    );

    const buttons = jest.mocked(Alert.alert).mock.calls[0]?.[2] as
      | Array<{ text?: string; onPress?: () => void }>
      | undefined;
    const withdrawButton = buttons?.find((button) => button.text === "탈퇴");

    act(() => {
      withdrawButton?.onPress?.();
    });

    expect(mockUseDeleteUserAccountMutation).toHaveBeenCalledWith({ onSuccess: mockHandleLogout });
    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith(
      undefined,
      expect.not.objectContaining({ onSuccess: expect.anything() }),
    );
  });
});

describe("프로필 초기 조회", () => {
  it.each([
    [true, false],
    [false, true],
    [true, true],
  ])("가족 또는 설정 조회가 남아 있으면 기다린다 (%s, %s)", (families, settings) => {
    mockFamiliesLoading = families;
    mockSettingsLoading = settings;
    const { result, rerender } = renderHook(() => useProfileViewModel());
    expect(result.current.isLoading).toBe(true);
    mockFamiliesLoading = false;
    mockSettingsLoading = false;
    rerender({});
    expect(result.current.isLoading).toBe(false);
    act(() => result.current.handleRetry());
    expect(mockFamiliesRefetch).toHaveBeenCalled();
    expect(mockSettingsRefetch).toHaveBeenCalled();
  });
});
