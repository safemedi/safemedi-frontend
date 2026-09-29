const mockRequireOptionalNativeModule = jest.fn();
const mockSetRegisteredDeviceToken = jest.fn();
const mockSetNotificationHandler = jest.fn();
const mockGetPermissionsAsync = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const mockSetNotificationChannelAsync = jest.fn();
const mockGetDevicePushTokenAsync = jest.fn();
const mockAddNotificationReceivedListener = jest.fn();
const mockAddNotificationResponseReceivedListener = jest.fn();

let mockPlatformOS: "android" | "ios" = "android";
let mockIsDevice = true;

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    get isDevice() {
      return mockIsDevice;
    },
  },
}));

jest.mock("expo-modules-core", () => ({
  requireOptionalNativeModule: (name: string) => mockRequireOptionalNativeModule(name),
}));

jest.mock("react-native", () => ({
  Platform: {
    get OS() {
      return mockPlatformOS;
    },
  },
}));

jest.mock("expo-notifications", () => ({
  AndroidImportance: {
    MAX: "max",
  },
  addNotificationReceivedListener: (...args: unknown[]) =>
    mockAddNotificationReceivedListener(...args),
  addNotificationResponseReceivedListener: (...args: unknown[]) =>
    mockAddNotificationResponseReceivedListener(...args),
  getDevicePushTokenAsync: (...args: unknown[]) => mockGetDevicePushTokenAsync(...args),
  getPermissionsAsync: (...args: unknown[]) => mockGetPermissionsAsync(...args),
  requestPermissionsAsync: (...args: unknown[]) => mockRequestPermissionsAsync(...args),
  setNotificationChannelAsync: (...args: unknown[]) => mockSetNotificationChannelAsync(...args),
  setNotificationHandler: (...args: unknown[]) => mockSetNotificationHandler(...args),
}));

jest.mock("@/hooks/pushNotificationTokenStore", () => ({
  clearRegisteredDeviceToken: jest.fn(),
  getRegisteredDeviceToken: jest.fn(),
  setRegisteredDeviceToken: (token: string | null) => mockSetRegisteredDeviceToken(token),
}));

function loadPushNotifications() {
  jest.resetModules();
  return require("../pushNotifications") as typeof import("../pushNotifications");
}

describe("pushNotifications", () => {
  const originalIosRemotePush = process.env.EXPO_PUBLIC_IOS_ENABLE_REMOTE_PUSH;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPlatformOS = "android";
    mockIsDevice = true;
    process.env.EXPO_PUBLIC_IOS_ENABLE_REMOTE_PUSH = undefined;
    mockRequireOptionalNativeModule.mockReturnValue({});
    mockGetPermissionsAsync.mockResolvedValue({ status: "granted" });
    mockRequestPermissionsAsync.mockResolvedValue({ status: "granted" });
    mockGetDevicePushTokenAsync.mockResolvedValue({ data: "fcm-token" });
    mockAddNotificationReceivedListener.mockReturnValue({ remove: jest.fn() });
    mockAddNotificationResponseReceivedListener.mockReturnValue({ remove: jest.fn() });
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_IOS_ENABLE_REMOTE_PUSH = originalIosRemotePush;
  });

  it("native module이 없으면 권한/토큰/등록을 모두 스킵한다", async () => {
    mockRequireOptionalNativeModule.mockReturnValue(null);
    const pushNotifications = loadPushNotifications();
    const registerFn = jest.fn();

    expect(pushNotifications.isPushNotificationsNativeModuleAvailable()).toBe(false);
    await expect(pushNotifications.requestPushNotificationPermissions()).resolves.toBe(false);
    await expect(pushNotifications.getDevicePushToken()).resolves.toBeNull();
    await expect(pushNotifications.registerPushTokenWithBackend(registerFn)).resolves.toEqual({
      status: "skipped",
      reason: "native-module-unavailable",
    });

    const subscription = pushNotifications.addNotificationReceivedListener(jest.fn());
    expect(() => subscription.remove()).not.toThrow();
    expect(registerFn).not.toHaveBeenCalled();
  });

  it("Android에서 권한이 있으면 채널을 설정하고 FCM 토큰을 서버 등록 payload로 전달한다", async () => {
    const pushNotifications = loadPushNotifications();
    const registerFn = jest.fn(async () => undefined);

    await expect(pushNotifications.registerPushTokenWithBackend(registerFn)).resolves.toEqual({
      status: "registered",
    });

    expect(mockSetNotificationHandler).toHaveBeenCalledTimes(1);
    expect(mockSetNotificationChannelAsync).toHaveBeenCalledWith(
      "default",
      expect.objectContaining({ name: "SafeMedi 알림" }),
    );
    expect(mockSetRegisteredDeviceToken).toHaveBeenCalledWith("fcm-token");
    expect(registerFn).toHaveBeenCalledWith({ deviceToken: "fcm-token", deviceType: "ANDROID" });
  });

  it("권한 요청 결과가 거부되면 토큰 등록을 device-token-unavailable로 스킵한다", async () => {
    mockGetPermissionsAsync.mockResolvedValue({ status: "undetermined" });
    mockRequestPermissionsAsync.mockResolvedValue({ status: "denied" });
    const pushNotifications = loadPushNotifications();
    const registerFn = jest.fn();

    await expect(pushNotifications.registerPushTokenWithBackend(registerFn)).resolves.toEqual({
      status: "skipped",
      reason: "device-token-unavailable",
    });

    expect(mockRequestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(registerFn).not.toHaveBeenCalled();
  });

  it("iOS simulator와 원격 푸시 비활성화 상태를 구분해 스킵한다", async () => {
    mockPlatformOS = "ios";
    mockIsDevice = false;
    const simulatorPushNotifications = loadPushNotifications();

    await expect(
      simulatorPushNotifications.registerPushTokenWithBackend(jest.fn()),
    ).resolves.toEqual({
      status: "skipped",
      reason: "ios-simulator",
    });

    mockIsDevice = true;
    const disabledPushNotifications = loadPushNotifications();

    await expect(
      disabledPushNotifications.registerPushTokenWithBackend(jest.fn()),
    ).resolves.toEqual({
      status: "skipped",
      reason: "ios-remote-push-disabled",
    });
  });

  it("iOS 원격 푸시가 활성화되면 IOS deviceType으로 등록한다", async () => {
    mockPlatformOS = "ios";
    process.env.EXPO_PUBLIC_IOS_ENABLE_REMOTE_PUSH = "true";
    const pushNotifications = loadPushNotifications();
    const registerFn = jest.fn(async () => undefined);

    await expect(pushNotifications.registerPushTokenWithBackend(registerFn)).resolves.toEqual({
      status: "registered",
    });

    expect(mockSetNotificationChannelAsync).not.toHaveBeenCalled();
    expect(registerFn).toHaveBeenCalledWith({ deviceToken: "fcm-token", deviceType: "IOS" });
  });

  it("알림 수신/응답 listener는 expo-notifications subscription을 반환한다", () => {
    const pushNotifications = loadPushNotifications();
    const receivedListener = jest.fn();
    const responseListener = jest.fn();

    pushNotifications.addNotificationReceivedListener(receivedListener);
    pushNotifications.addNotificationResponseListener(responseListener);

    expect(mockAddNotificationReceivedListener).toHaveBeenCalledWith(receivedListener);
    expect(mockAddNotificationResponseReceivedListener).toHaveBeenCalledWith(responseListener);
  });
});
