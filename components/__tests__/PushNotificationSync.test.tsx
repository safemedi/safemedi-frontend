import { render, waitFor } from "@testing-library/react-native";
import { queryKeys } from "@/api/query-keys";
import { PushNotificationSync } from "../PushNotificationSync";

const mockPostDeviceToken = jest.fn();
const mockRegisterPushTokenWithBackend = jest.fn();
const mockAddNotificationReceivedListener = jest.fn();
const mockAddNotificationResponseListener = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockReceivedRemove = jest.fn();
const mockResponseRemove = jest.fn();

let mockHydrated = true;
let mockAccessToken: string | null = "token";
let receivedListener: (() => void) | undefined;
let responseListener: (() => void) | undefined;

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

jest.mock("@/api/endpoints/device-token", () => ({
  postDeviceToken: (body: unknown) => mockPostDeviceToken(body),
}));

jest.mock("@/hooks/pushNotifications", () => ({
  addNotificationReceivedListener: (listener: () => void) =>
    mockAddNotificationReceivedListener(listener),
  addNotificationResponseListener: (listener: () => void) =>
    mockAddNotificationResponseListener(listener),
  registerPushTokenWithBackend: (registerFn: unknown) =>
    mockRegisterPushTokenWithBackend(registerFn),
}));

jest.mock("@/hooks/useSessionHydrated", () => ({
  useSessionHydrated: () => mockHydrated,
}));

jest.mock("@/stores/sessionStore", () => ({
  useSessionStore: (selector: (state: { accessToken: string | null }) => unknown) =>
    selector({ accessToken: mockAccessToken }),
}));

describe("PushNotificationSync", () => {
  const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    mockHydrated = true;
    mockAccessToken = "token";
    receivedListener = undefined;
    responseListener = undefined;
    mockPostDeviceToken.mockResolvedValue({ message: "ok" });
    mockRegisterPushTokenWithBackend.mockImplementation(
      async (registerFn: (body: unknown) => void) => {
        await registerFn({ deviceToken: "token", deviceType: "ANDROID" });
        return { status: "registered" };
      },
    );
    mockAddNotificationReceivedListener.mockImplementation((listener: () => void) => {
      receivedListener = listener;
      return { remove: mockReceivedRemove };
    });
    mockAddNotificationResponseListener.mockImplementation((listener: () => void) => {
      responseListener = listener;
      return { remove: mockResponseRemove };
    });
  });

  afterAll(() => {
    warnSpy.mockRestore();
  });

  it("세션 hydrate 전이거나 accessToken이 없으면 토큰 등록을 시작하지 않는다", () => {
    mockHydrated = false;
    render(<PushNotificationSync />);
    expect(mockRegisterPushTokenWithBackend).not.toHaveBeenCalled();

    mockHydrated = true;
    mockAccessToken = null;
    render(<PushNotificationSync />);
    expect(mockRegisterPushTokenWithBackend).not.toHaveBeenCalled();
  });

  it("로그인 상태면 디바이스 토큰을 등록하고 푸시 수신 시 알림/대시보드 쿼리를 무효화한다", async () => {
    const { unmount } = render(<PushNotificationSync />);

    await waitFor(() =>
      expect(mockPostDeviceToken).toHaveBeenCalledWith({
        deviceToken: "token",
        deviceType: "ANDROID",
      }),
    );

    receivedListener?.();
    responseListener?.();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["notification"] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.dashboard.todayMedicationSchedules,
    });
    expect(mockInvalidateQueries).toHaveBeenCalledTimes(4);

    unmount();
    expect(mockReceivedRemove).toHaveBeenCalledTimes(1);
    expect(mockResponseRemove).toHaveBeenCalledTimes(1);
  });

  it("토큰 등록이 스킵되면 개발 로그를 남긴다", async () => {
    mockRegisterPushTokenWithBackend.mockResolvedValue({
      status: "skipped",
      reason: "device-token-unavailable",
    });

    render(<PushNotificationSync />);

    await waitFor(() =>
      expect(warnSpy).toHaveBeenCalledWith(
        "[PushNotificationSync] FCM 디바이스 토큰 등록 스킵 (device-token-unavailable)",
      ),
    );
  });

  it("토큰 등록 실패는 에러 메시지를 포함해 개발 로그로 남긴다", async () => {
    mockRegisterPushTokenWithBackend.mockRejectedValue(new Error("network"));

    render(<PushNotificationSync />);

    await waitFor(() =>
      expect(warnSpy).toHaveBeenCalledWith(
        "[PushNotificationSync] FCM 디바이스 토큰 등록 실패: network",
      ),
    );
  });

  it("cleanup 이후 완료된 등록 callback은 서버 요청을 생략한다", async () => {
    let resolveRegistration: (value: { status: "registered" }) => void = () => {};
    mockRegisterPushTokenWithBackend.mockImplementation(
      (registerFn: (body: unknown) => Promise<void>) =>
        new Promise((resolve) => {
          resolveRegistration = resolve;
          void registerFn({ deviceToken: "late-token", deviceType: "ANDROID" });
        }),
    );

    const { unmount } = render(<PushNotificationSync />);
    unmount();
    resolveRegistration({ status: "registered" });

    await waitFor(() => expect(mockReceivedRemove).toHaveBeenCalledTimes(1));
  });
});
