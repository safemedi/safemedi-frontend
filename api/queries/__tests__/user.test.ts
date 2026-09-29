import { useQueryClient } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react-native";
import { queryKeys } from "@/api/query-keys";
import {
  useCompleteTutorialMutation,
  useDeleteUserAccountMutation,
  useLoginMutation,
  useUpdateUserProfileMutation,
  useUserProfile,
} from "../user";

const mockUseQueryClient = useQueryClient as jest.MockedFunction<typeof useQueryClient>;
const mockPostSocialLogin = jest.fn<Promise<unknown>, [unknown, unknown]>();
const mockFetchUserProfile = jest.fn<Promise<unknown>, []>();
const mockFetchUserProfileWithAccessToken = jest.fn<Promise<unknown>, [unknown]>();
const mockPostTutorialRegistration = jest.fn<Promise<unknown>, [unknown]>();
const mockPatchUserProfile = jest.fn<Promise<unknown>, [unknown]>();
const mockDeleteUserAccount = jest.fn<Promise<unknown>, []>();
const mockProfileToUser = jest.fn<unknown, [unknown]>();
const mockSetAccessToken = jest.fn();
const mockSetRefreshToken = jest.fn();
const mockSetTutorialCompleted = jest.fn();
const mockSetUser = jest.fn();
const mockSetQueryData = jest.fn<unknown, [unknown, unknown]>();
const mockInvalidateQueries = jest.fn(async () => {});

let mockAccessToken: string | null = "token";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn((options: unknown) => options),
  useMutation: jest.fn((options: unknown) => options),
  useQueryClient: jest.fn(),
}));

jest.mock("@/api/endpoints/auth", () => ({
  postSocialLogin: (provider: unknown, accessToken: unknown) =>
    mockPostSocialLogin(provider, accessToken),
}));

jest.mock("@/api/endpoints/tutorial", () => ({
  postTutorialRegistration: (body: unknown) => mockPostTutorialRegistration(body),
}));

jest.mock("@/api/endpoints/user", () => ({
  fetchUserProfile: () => mockFetchUserProfile(),
  fetchUserProfileWithAccessToken: (accessToken: unknown) =>
    mockFetchUserProfileWithAccessToken(accessToken),
  patchUserProfile: (body: unknown) => mockPatchUserProfile(body),
  deleteUserAccount: () => mockDeleteUserAccount(),
}));

jest.mock("@/stores/sessionStore", () => ({
  useSessionStore: (
    selector: (state: {
      accessToken: string | null;
      setAccessToken: (token: string | null) => void;
      setRefreshToken: (token: string | null) => void;
      setTutorialCompleted: (value: boolean) => void;
    }) => unknown,
  ) =>
    selector({
      accessToken: mockAccessToken,
      setAccessToken: mockSetAccessToken,
      setRefreshToken: mockSetRefreshToken,
      setTutorialCompleted: mockSetTutorialCompleted,
    }),
}));

jest.mock("@/stores/userStore", () => ({
  useUserStore: {
    getState: () => ({
      setUser: mockSetUser,
    }),
  },
}));

jest.mock("@/utils/user-mapper", () => ({
  profileToUser: (profile: unknown) => mockProfileToUser(profile),
}));

describe("api/queries/user", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessToken = "token";
    mockUseQueryClient.mockReturnValue({
      setQueryData: mockSetQueryData,
      invalidateQueries: mockInvalidateQueries,
    } as unknown as ReturnType<typeof useQueryClient>);
    mockPostSocialLogin.mockResolvedValue({
      accessToken: "new-token",
      refreshToken: "new-refresh-token",
      isTutorialCompleted: true,
    });
    mockFetchUserProfileWithAccessToken.mockResolvedValue({ isTutorialCompleted: true });
    mockPostTutorialRegistration.mockResolvedValue({});
    mockPatchUserProfile.mockResolvedValue({ id: "me", isTutorialCompleted: true });
    mockProfileToUser.mockReturnValue({ id: "me" });
  });

  it("useUserProfile는 토큰 유무에 따라 enabled를 설정한다", () => {
    const withToken = renderHook(() => useUserProfile());
    const queryWithToken = withToken.result.current as unknown as {
      enabled: boolean;
      queryKey: unknown;
    };
    expect(queryWithToken.enabled).toBe(true);
    expect(queryWithToken.queryKey).toEqual(queryKeys.user.me);

    mockAccessToken = null;
    const withoutToken = renderHook(() => useUserProfile());
    const queryWithoutToken = withoutToken.result.current as unknown as { enabled: boolean };
    expect(queryWithoutToken.enabled).toBe(false);
  });

  it("useLoginMutation은 로그인 + 프로필 조회를 수행하고 onSuccess에서 상태를 갱신한다", async () => {
    const { result } = renderHook(() => useLoginMutation());
    const mutation = result.current as unknown as {
      mutationFn: (args: { provider: "kakao" | "naver"; accessToken: string }) => Promise<{
        accessToken: string;
        refreshToken: string;
        isTutorialCompleted: boolean;
        profile: { isTutorialCompleted: boolean };
      }>;
      onSuccess: (value: {
        accessToken: string;
        refreshToken: string;
        isTutorialCompleted: boolean;
        profile: { isTutorialCompleted: boolean };
      }) => void;
    };

    const payload = await mutation.mutationFn({ provider: "kakao", accessToken: "kakao-token" });
    expect(payload.accessToken).toBe("new-token");
    expect(payload.refreshToken).toBe("new-refresh-token");
    expect(payload.isTutorialCompleted).toBe(true);
    expect(mockPostSocialLogin).toHaveBeenCalledWith("kakao", "kakao-token");
    expect(mockFetchUserProfileWithAccessToken).toHaveBeenCalledWith("new-token");

    mutation.onSuccess(payload);
    expect(mockSetAccessToken).toHaveBeenCalledWith("new-token");
    expect(mockSetRefreshToken).toHaveBeenCalledWith("new-refresh-token");
    // 명세서 기준: 로그인 응답의 isTutorialCompleted를 사용해 튜토리얼 라우팅을 결정합니다.
    expect(mockSetTutorialCompleted).toHaveBeenCalledWith(true);
    expect(mockSetQueryData).toHaveBeenCalledWith(queryKeys.user.me, payload.profile);
    expect(mockSetUser).toHaveBeenCalledWith({ id: "me" });
  });

  it("login 응답에 accessToken이 없으면 에러를 던진다", async () => {
    mockPostSocialLogin.mockResolvedValue({});
    const { result } = renderHook(() => useLoginMutation());
    const mutation = result.current as unknown as {
      mutationFn: (args: { provider: "kakao" | "naver"; accessToken: string }) => Promise<unknown>;
    };

    await expect(mutation.mutationFn({ provider: "kakao", accessToken: "x" })).rejects.toThrow(
      "로그인 응답에 accessToken이 없습니다.",
    );
  });

  it("useCompleteTutorialMutation은 성공 시 튜토리얼 완료 상태를 반영한다", async () => {
    const { result } = renderHook(() => useCompleteTutorialMutation());
    const mutation = result.current as unknown as {
      mutationFn: (body: unknown) => Promise<unknown>;
      onSuccess: () => Promise<void>;
    };

    await mutation.mutationFn({ birthDate: "1999-01-01" });
    expect(mockPostTutorialRegistration).toHaveBeenCalledTimes(1);

    mockSetQueryData.mockImplementation((_key, updater) => {
      if (typeof updater === "function") {
        return updater({ isTutorialCompleted: false });
      }
      return updater;
    });
    await mutation.onSuccess();
    expect(mockSetTutorialCompleted).toHaveBeenCalledWith(true);
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.user.me });
  });

  it("useUpdateUserProfileMutation은 성공 시 캐시/스토어를 갱신한다", async () => {
    const { result } = renderHook(() => useUpdateUserProfileMutation());
    const mutation = result.current as unknown as {
      mutationFn: (body: unknown) => Promise<unknown>;
      onSuccess: (updated: { id: string }) => Promise<void>;
    };

    await mutation.mutationFn({ nickname: "새 닉네임" });
    expect(mockPatchUserProfile).toHaveBeenCalledWith({ nickname: "새 닉네임" });

    await mutation.onSuccess({ id: "me" });
    expect(mockSetQueryData).toHaveBeenCalledWith(queryKeys.user.me, { id: "me" });
    expect(mockSetUser).toHaveBeenCalledWith({ id: "me" });
  });

  it("useDeleteUserAccountMutation은 deleteUserAccount를 호출한다", async () => {
    const onSuccess = jest.fn();
    mockDeleteUserAccount.mockResolvedValue({ message: "ok" });
    const { result } = renderHook(() => useDeleteUserAccountMutation({ onSuccess }));
    const mutation = result.current as unknown as {
      mutationKey: unknown;
      mutationFn: () => Promise<unknown>;
      onSuccess: () => void;
    };

    expect(mutation.mutationKey).toEqual(queryKeys.user.deleteAccount);
    await mutation.mutationFn();
    expect(mockDeleteUserAccount).toHaveBeenCalledTimes(1);
    mutation.onSuccess();
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
