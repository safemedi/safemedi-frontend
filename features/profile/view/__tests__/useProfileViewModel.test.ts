import { act, renderHook } from "@testing-library/react-native";
import { Alert } from "react-native";

import { useProfileViewModel } from "../useProfileViewModel";

const mockMutate = jest.fn();
const mockHandleLogout = jest.fn(async () => {});
const mockUseDeleteUserAccountMutation = jest.fn(() => ({
  mutate: mockMutate,
  isPending: false,
}));

jest.mock("@/api/queries/profile", () => ({
  useFamilyProfiles: () => ({ data: [] }),
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
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
