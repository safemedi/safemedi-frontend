const mockMessaging = { isDeviceRegisteredForRemoteMessages: false };
const mockRegister = jest.fn();
const mockPermission = jest.fn();
const mockGetToken = jest.fn();
const mockRefresh = jest.fn();
const mockOnMessage = jest.fn();
const mockOpened = jest.fn();
const mockInitial = jest.fn();

jest.mock("@react-native-firebase/messaging", () => ({
  getMessaging: () => mockMessaging,
  requestPermission: (...args: unknown[]) => mockPermission(...args),
  AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2, EPHEMERAL: 3 },
  registerDeviceForRemoteMessages: (...args: unknown[]) => mockRegister(...args),
  getToken: (...args: unknown[]) => mockGetToken(...args),
  onTokenRefresh: (...args: unknown[]) => mockRefresh(...args),
  onMessage: (...args: unknown[]) => mockOnMessage(...args),
  onNotificationOpenedApp: (...args: unknown[]) => mockOpened(...args),
  getInitialNotification: (...args: unknown[]) => mockInitial(...args),
}));

import {
  getIosFcmToken,
  requestIosFcmPermission,
  subscribeIosFcmResponse,
  subscribeIosFcmTokenRefresh,
} from "../iosFcm";

describe("iOS FCM 연결", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMessaging.isDeviceRegisteredForRemoteMessages = false;
    mockRegister.mockResolvedValue(undefined);
    mockGetToken.mockResolvedValue("fcm-token");
    mockOpened.mockReturnValue(jest.fn());
  });

  it.each([1, 2, 3])("허용된 알림 권한 상태 %s는 등록을 허용한다", async (status) => {
    mockPermission.mockResolvedValue(status);
    await expect(requestIosFcmPermission()).resolves.toBe(true);
  });

  it("알림 권한 거부는 등록을 허용하지 않는다", async () => {
    mockPermission.mockResolvedValue(0);
    await expect(requestIosFcmPermission()).resolves.toBe(false);
  });

  it("APNs 등록을 마친 뒤 FCM 토큰을 발급받는다", async () => {
    await expect(getIosFcmToken()).resolves.toBe("fcm-token");
    expect(mockRegister).toHaveBeenCalledWith(mockMessaging);
    expect(mockGetToken).toHaveBeenCalledWith(mockMessaging);
    expect(mockRegister.mock.invocationCallOrder[0]).toBeLessThan(
      mockGetToken.mock.invocationCallOrder[0],
    );
  });

  it("APNs 등록 실패 시 FCM 토큰을 요청하지 않는다", async () => {
    mockRegister.mockRejectedValue(new Error("registration failed"));
    await expect(getIosFcmToken()).rejects.toThrow("registration failed");
    expect(mockGetToken).not.toHaveBeenCalled();
  });

  it("이미 등록한 기기는 APNs 재등록을 생략한다", async () => {
    mockMessaging.isDeviceRegisteredForRemoteMessages = true;
    await getIosFcmToken();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("FCM 토큰 갱신을 구독하고 해제 함수를 반환한다", () => {
    const listener = jest.fn();
    const unsubscribe = jest.fn();
    mockRefresh.mockReturnValue(unsubscribe);
    expect(subscribeIosFcmTokenRefresh(listener)).toBe(unsubscribe);
    expect(mockRefresh).toHaveBeenCalledWith(mockMessaging, listener);
  });

  it("앱 종료 상태에서 알림으로 실행되면 초기 응답을 전달한다", async () => {
    mockInitial.mockResolvedValue({ messageId: "notification" });
    const listener = jest.fn();
    subscribeIosFcmResponse(listener);
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("구독 해제 후 도착한 초기 알림은 전달하지 않는다", async () => {
    let resolve: (value: unknown) => void = () => {};
    mockInitial.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const listener = jest.fn();
    const unsubscribe = subscribeIosFcmResponse(listener);
    unsubscribe();
    resolve({ messageId: "late" });
    await Promise.resolve();
    expect(listener).not.toHaveBeenCalled();
  });
});
