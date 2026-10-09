import { renderHook } from "@testing-library/react-native";
import { useRegisterDeviceTokenMutation } from "@/api/queries/device-token";

const mockDelete = jest.fn();
const mockRegister = jest.fn();
const mockClearPending = jest.fn();
let mockAccessToken = "access-a";
let mockPendingTokens = ["old-device"];
jest.mock("@tanstack/react-query", () => ({ useMutation: (options: unknown) => options }));
jest.mock("@/api/endpoints/device-token", () => ({
  deleteDeviceToken: (...args: unknown[]) => mockDelete(...args),
  postDeviceToken: (...args: unknown[]) => mockRegister(...args),
}));
jest.mock("@/api/error", () => ({ parseApiError: async (error: unknown) => error }));
jest.mock("@/hooks/pushNotificationTokenStore", () => ({
  restoreDeviceTokenState: async () => {},
  getPendingDeviceTokenCleanups: () => mockPendingTokens,
  clearPendingDeviceTokenCleanup: (token: string) => mockClearPending(token),
}));
jest.mock("@/stores/sessionStore", () => ({
  useSessionStore: { getState: () => ({ accessToken: mockAccessToken }) },
}));

interface Variables {
  body?: { deviceToken: string; deviceType: "ANDROID" };
  accessToken: string;
  signal: AbortSignal;
}
function setup() {
  const { result } = renderHook(() => useRegisterDeviceTokenMutation());
  const mutation = result.current as unknown as {
    mutationFn: (variables: Variables) => Promise<unknown>;
  };
  return () =>
    mutation.mutationFn({
      body: { deviceToken: "current-device", deviceType: "ANDROID" },
      accessToken: "access-a",
      signal: new AbortController().signal,
    });
}
beforeEach(() => {
  jest.clearAllMocks();
  mockDelete.mockReset().mockResolvedValue(undefined);
  mockRegister.mockResolvedValue({ deviceId: 1 });
  mockAccessToken = "access-a";
  mockPendingTokens = ["old-device"];
});
it("보류 토큰을 해제한 뒤 현재 토큰을 등록하며 세션 로그아웃을 호출하지 않는다", async () => {
  await setup()();
  expect(mockDelete).toHaveBeenCalledWith(
    "old-device",
    expect.objectContaining({ accessToken: "access-a" }),
  );
  expect(mockClearPending).toHaveBeenCalledWith("old-device");
  expect(mockDelete.mock.invocationCallOrder[0]).toBeLessThan(
    mockRegister.mock.invocationCallOrder[0],
  );
});
it("다른 계정 소유 토큰은 보류하고 현재 토큰만 등록한다", async () => {
  mockDelete.mockRejectedValue({ status: 403, code: "NOTI_001" });
  await setup()();
  expect(mockClearPending).not.toHaveBeenCalledWith("old-device");
  expect(mockRegister).toHaveBeenCalledTimes(1);
});
it("이미 없는 토큰만 정리 완료로 간주한다", async () => {
  mockDelete.mockRejectedValue({ status: 404, code: "NOTI_002" });
  await setup()();
  expect(mockClearPending).toHaveBeenCalledWith("old-device");
});
it.each([401, 500, 404])("인증·서버·알 수 없는 %s 오류는 보류 기록을 유지한다", async (status) => {
  mockDelete.mockRejectedValue({ status });
  await expect(setup()()).rejects.toEqual({ status });
  expect(mockClearPending).not.toHaveBeenCalled();
  expect(mockRegister).not.toHaveBeenCalled();
});
it("작업 전 계정이 바뀌면 이전 인증으로 처리하지 않는다", async () => {
  mockAccessToken = "access-b";
  await expect(setup()()).rejects.toThrow("취소된 디바이스 토큰 등록");
  expect(mockDelete).not.toHaveBeenCalled();
  expect(mockRegister).not.toHaveBeenCalled();
});

it("푸시 권한이나 새 토큰이 없어도 인증된 세션으로 보류 작업을 먼저 처리한다", async () => {
  const { result } = renderHook(() => useRegisterDeviceTokenMutation());
  const mutation = result.current as unknown as {
    mutationFn: (variables: Variables) => Promise<unknown>;
  };
  await mutation.mutationFn({ accessToken: "access-a", signal: new AbortController().signal });
  expect(mockDelete).toHaveBeenCalledTimes(1);
  expect(mockRegister).not.toHaveBeenCalled();
});
