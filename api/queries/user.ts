import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { postSocialLogin } from "@/api/endpoints/auth";
import { postTutorialRegistration } from "@/api/endpoints/tutorial";
import {
  deleteUserAccount,
  fetchUserProfile,
  fetchUserProfileWithAccessToken,
  patchUserProfile,
} from "@/api/endpoints/user";
import {
  applyOptimisticUserProfile,
  getProfileFromUser,
  type UpdateUserProfileVariables,
} from "@/api/queries/optimisticUserProfile";
import { queryKeys } from "@/api/query-keys";
import type { TutorialRegistrationBody } from "@/api/types/tutorial";
import type { UserProfile } from "@/api/types/user";
import { useSessionStore } from "@/stores/sessionStore";
import { useUserStore } from "@/stores/userStore";
import { profileToUser } from "@/utils/user-mapper";

const STALE_MS = 5 * 60 * 1000;
const GC_MS = 1000 * 60 * 60 * 24;

export function useUserProfile() {
  const accessToken = useSessionStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.user.me,
    queryFn: fetchUserProfile,
    enabled: !!accessToken,
    staleTime: STALE_MS,
    gcTime: GC_MS,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setAccessToken = useSessionStore((s) => s.setAccessToken);
  const setRefreshToken = useSessionStore((s) => s.setRefreshToken);
  const setTutorialCompleted = useSessionStore((s) => s.setTutorialCompleted);

  return useMutation({
    mutationFn: async ({
      provider,
      accessToken,
    }: {
      provider: "kakao" | "naver";
      accessToken: string;
    }) => {
      const loginResponse = await postSocialLogin(provider, accessToken);
      if (!loginResponse?.accessToken) {
        throw new Error("로그인 응답에 accessToken이 없습니다.");
      }

      const profile = await fetchUserProfileWithAccessToken(loginResponse.accessToken);
      return {
        accessToken: loginResponse.accessToken,
        refreshToken: loginResponse.refreshToken,
        isTutorialCompleted: loginResponse.isTutorialCompleted,
        profile,
      };
    },
    onSuccess: ({ accessToken, refreshToken, isTutorialCompleted, profile }) => {
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      setTutorialCompleted(isTutorialCompleted);
      queryClient.setQueryData(queryKeys.user.me, profile);
      useUserStore.getState().setUser(profileToUser(profile));
    },
  });
}

export function useCompleteTutorialMutation() {
  const queryClient = useQueryClient();
  const setTutorialCompleted = useSessionStore((s) => s.setTutorialCompleted);

  return useMutation({
    mutationFn: (body: TutorialRegistrationBody) => postTutorialRegistration(body),
    onSuccess: async () => {
      setTutorialCompleted(true);
      queryClient.setQueryData<UserProfile | undefined>(queryKeys.user.me, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          isTutorialCompleted: true,
        };
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
    },
  });
}

export function useUpdateUserProfileMutation() {
  const queryClient = useQueryClient();
  const pendingCount = useIsMutating({ mutationKey: queryKeys.user.updateProfile });
  const mutation = useMutation({
    mutationKey: queryKeys.user.updateProfile,
    mutationFn: ({ diseaseNames: _diseaseNames, ...body }: UpdateUserProfileVariables) =>
      patchUserProfile(body),
    onMutate: async (body) => {
      if (queryClient.isMutating({ mutationKey: queryKeys.user.updateProfile }) > 1) {
        throw new Error("프로필 저장 중입니다. 잠시 후 다시 시도해주세요.");
      }
      const sessionVersion = useSessionStore.getState().sessionVersion;
      await queryClient.cancelQueries({ queryKey: queryKeys.user.me });
      if (useSessionStore.getState().sessionVersion !== sessionVersion) {
        throw new Error("로그인 상태가 변경되었습니다.");
      }
      const previousUser = useUserStore.getState().user;
      const previous =
        queryClient.getQueryData<UserProfile>(queryKeys.user.me) ??
        (previousUser ? getProfileFromUser(previousUser) : undefined);
      if (previous) {
        const optimistic = applyOptimisticUserProfile(previous, body);
        queryClient.setQueryData(queryKeys.user.me, optimistic);
        useUserStore.getState().setUser(profileToUser(optimistic));
      }
      return { previous, previousUser, sessionVersion };
    },
    onError: (_error, _body, context) => {
      if (!context || useSessionStore.getState().sessionVersion !== context.sessionVersion) return;
      if (context.previous) queryClient.setQueryData(queryKeys.user.me, context.previous);
      useUserStore.getState().setUser(context.previousUser);
    },
    onSuccess: (updatedProfile, _body, context) => {
      if (!context || useSessionStore.getState().sessionVersion !== context.sessionVersion) return;
      queryClient.setQueryData(queryKeys.user.me, updatedProfile);
      useUserStore.getState().setUser(profileToUser(updatedProfile));
    },
    onSettled: (_data, _error, _body, context) => {
      if (!context || useSessionStore.getState().sessionVersion !== context.sessionVersion) return;
      return queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
    },
  });
  return { ...mutation, isPending: mutation.isPending || pendingCount > 0 };
}

export function useDeleteUserAccountMutation(options?: {
  readonly onSuccess?: () => void | Promise<void>;
}) {
  return useMutation({
    mutationKey: queryKeys.user.deleteAccount,
    mutationFn: deleteUserAccount,
    onSuccess: options?.onSuccess,
  });
}
