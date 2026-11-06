import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { queryKeys } from "@/api/query-keys";
import type { UserProfile } from "@/api/types/user";
import { useSessionStore } from "@/stores/sessionStore";
import { useUserStore } from "@/stores/userStore";
import { profileToUser } from "@/utils/user-mapper";
import { useUpdateUserProfileMutation } from "../user";

const mockPatchProfile = jest.fn();
jest.mock("@/api/endpoints/user", () => ({
  patchUserProfile: (...args: unknown[]) => mockPatchProfile(...args),
}));
jest.mock("@/api/endpoints/auth", () => ({}));
jest.mock("@/api/endpoints/tutorial", () => ({}));
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const profile: UserProfile = {
  displayName: "기존 이름",
  birthDate: "1990-01-01",
  gender: "M",
  bloodType: "A+",
  height: 170,
  weight: 60,
  allergies: [],
  diseases: [],
  isTutorialCompleted: true,
};

function setup() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  function wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return { client, wrapper };
}

beforeEach(() => {
  jest.clearAllMocks();
  useUserStore.getState().clearUser();
});
it("프로필 전체 입력을 캐시와 스토어에 먼저 반영하고 화면이 사라져도 실패하면 복구한다", async () => {
  const { client, wrapper } = setup();
  client.setQueryData(queryKeys.user.me, profile);
  useUserStore.getState().setUser(profileToUser(profile));
  const request = deferred<unknown>();
  mockPatchProfile.mockReturnValue(request.promise);
  const { result, unmount } = renderHook(() => useUpdateUserProfileMutation(), { wrapper });
  let pending!: Promise<unknown>;
  await act(async () => {
    pending = result.current
      .mutateAsync({
        nickname: "새 이름",
        gender: "FEMALE",
        bloodType: "AB",
        rhType: "MINUS",
        diseaseCodes: ["G43"],
        diseaseNames: { G43: "편두통" },
        allergies: [{ type: "FOOD", value: "우유", name: "우유" }],
      })
      .catch(() => undefined);
  });
  expect(client.getQueryData<UserProfile>(queryKeys.user.me)).toMatchObject({
    displayName: "새 이름",
    gender: "F",
    bloodType: "AB-",
    diseases: [{ code: "G43", name: "편두통" }],
    allergies: [{ code: "우유", name: "우유" }],
  });
  expect(useUserStore.getState().user).toMatchObject({
    displayName: "새 이름",
    chronicConditions: ["편두통"],
    allergies: ["우유"],
  });
  expect(mockPatchProfile.mock.calls[0][0]).not.toHaveProperty("diseaseNames");
  unmount();
  await act(async () => {
    request.reject(new Error("실패"));
    await pending;
  });
  expect(client.getQueryData(queryKeys.user.me)).toEqual(profile);
  expect(useUserStore.getState().user).toEqual(profileToUser(profile));
  client.clear();
});

it("프로필 성공 응답의 정규화된 값을 최종 반영한다", async () => {
  const { client, wrapper } = setup();
  client.setQueryData(queryKeys.user.me, profile);
  const updated = { ...profile, displayName: "서버 이름" };
  mockPatchProfile.mockResolvedValue(updated);
  const { result } = renderHook(() => useUpdateUserProfileMutation(), { wrapper });
  await act(async () => {
    await result.current.mutateAsync({ nickname: "입력 이름" });
  });
  await waitFor(() => expect(client.getQueryData(queryKeys.user.me)).toEqual(updated));
  expect(useUserStore.getState().user?.displayName).toBe("서버 이름");
  client.clear();
});

it.each([
  "성공",
  "실패",
])("프로필 저장 중 로그아웃하면 %s 응답이 이전 개인정보를 복원하지 않는다", async (outcome) => {
  const { client, wrapper } = setup();
  useSessionStore.getState().setAccessToken("test-session");
  client.setQueryData(queryKeys.user.me, profile);
  useUserStore.getState().setUser(profileToUser(profile));
  const request = deferred<unknown>();
  mockPatchProfile.mockReturnValue(request.promise);
  const { result } = renderHook(() => useUpdateUserProfileMutation(), { wrapper });
  let pending!: Promise<unknown>;
  await act(async () => {
    pending = result.current.mutateAsync({ nickname: "수정 이름" }).catch(() => undefined);
  });
  useSessionStore.getState().clearSession();
  useUserStore.getState().clearUser();
  client.removeQueries({ queryKey: queryKeys.user.me });
  const invalidate = jest.spyOn(client, "invalidateQueries");
  await act(async () => {
    if (outcome === "성공") request.resolve(profile);
    else request.reject(new Error("실패"));
    await pending;
  });
  expect(client.getQueryData(queryKeys.user.me)).toBeUndefined();
  expect(useUserStore.getState().user).toBeNull();
  expect(invalidate).not.toHaveBeenCalled();
  client.clear();
});
