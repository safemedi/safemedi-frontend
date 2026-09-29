import Constants from "expo-constants";
import { requireOptionalNativeModule } from "expo-modules-core";
import { Platform } from "react-native";

import type { DeviceType } from "@/api/types";
import { setRegisteredDeviceToken } from "@/hooks/pushNotificationTokenStore";

export {
  clearRegisteredDeviceToken,
  getRegisteredDeviceToken,
} from "@/hooks/pushNotificationTokenStore";

type ExpoNotificationsModule = typeof import("expo-notifications");

type NotificationListener = (notification: import("expo-notifications").Notification) => void;
type NotificationResponseListener = (
  response: import("expo-notifications").NotificationResponse,
) => void;

type EventSubscription = {
  remove: () => void;
};

export type PushTokenRegistrationResult =
  | { readonly status: "registered" }
  | {
      readonly status: "skipped";
      readonly reason:
        | "native-module-unavailable"
        | "ios-simulator"
        | "ios-remote-push-disabled"
        | "device-token-unavailable";
    };

const NOOP_SUBSCRIPTION: EventSubscription = { remove: () => {} };
const EXPO_PUSH_TOKEN_NATIVE_MODULE = "ExpoPushTokenManager";

let notificationsModule: ExpoNotificationsModule | null | undefined;
let notificationHandlerConfigured = false;
let pushNativeModuleChecked = false;
let pushNativeModuleAvailable = false;

function isPushTokenNativeModuleAvailable(): boolean {
  if (pushNativeModuleChecked) {
    return pushNativeModuleAvailable;
  }

  pushNativeModuleChecked = true;
  pushNativeModuleAvailable = requireOptionalNativeModule(EXPO_PUSH_TOKEN_NATIVE_MODULE) !== null;
  return pushNativeModuleAvailable;
}

function configureNotificationHandler(module: ExpoNotificationsModule): void {
  if (notificationHandlerConfigured) {
    return;
  }

  module.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  notificationHandlerConfigured = true;
}

function loadNotificationsModule(): ExpoNotificationsModule | null {
  if (notificationsModule !== undefined) {
    return notificationsModule;
  }

  if (!isPushTokenNativeModuleAvailable()) {
    notificationsModule = null;
    return null;
  }

  try {
    notificationsModule = require("expo-notifications") as ExpoNotificationsModule;
    configureNotificationHandler(notificationsModule);
  } catch {
    notificationsModule = null;
  }

  return notificationsModule;
}

export function isPushNotificationsNativeModuleAvailable(): boolean {
  return isPushTokenNativeModuleAvailable();
}

export async function requestPushNotificationPermissions(): Promise<boolean> {
  const notifications = loadNotificationsModule();
  if (!notifications) {
    return false;
  }

  const { status: existingStatus } = await notifications.getPermissionsAsync();
  if (existingStatus === "granted") {
    return true;
  }

  const { status } = await notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function getDevicePushToken(): Promise<string | null> {
  const notifications = loadNotificationsModule();
  if (!notifications) {
    return null;
  }

  const hasPermission = await requestPushNotificationPermissions();
  if (!hasPermission) {
    return null;
  }

  if (Platform.OS === "android") {
    await notifications.setNotificationChannelAsync("default", {
      name: "SafeMedi 알림",
      importance: notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#00C950",
    });
  }

  const tokenResponse = await notifications.getDevicePushTokenAsync();

  setRegisteredDeviceToken(tokenResponse.data);
  return tokenResponse.data;
}

export async function registerPushTokenWithBackend(
  registerFn: (body: { deviceToken: string; deviceType: DeviceType }) => Promise<unknown>,
): Promise<PushTokenRegistrationResult> {
  if (!isPushNotificationsNativeModuleAvailable()) {
    return { status: "skipped", reason: "native-module-unavailable" };
  }

  if (Platform.OS === "ios" && !Constants.isDevice) {
    return { status: "skipped", reason: "ios-simulator" };
  }

  // iOS 원격 푸시는 유료 Apple Developer + APNs 설정 후 활성화
  if (Platform.OS === "ios" && process.env.EXPO_PUBLIC_IOS_ENABLE_REMOTE_PUSH !== "true") {
    return { status: "skipped", reason: "ios-remote-push-disabled" };
  }

  const deviceToken = await getDevicePushToken();
  if (!deviceToken) {
    return { status: "skipped", reason: "device-token-unavailable" };
  }

  await registerFn({
    deviceToken,
    deviceType: Platform.OS === "ios" ? "IOS" : "ANDROID",
  });
  return { status: "registered" };
}

export function addNotificationReceivedListener(listener: NotificationListener): EventSubscription {
  const notifications = loadNotificationsModule();
  if (!notifications) {
    return NOOP_SUBSCRIPTION;
  }

  return notifications.addNotificationReceivedListener(listener);
}

export function addNotificationResponseListener(
  listener: NotificationResponseListener,
): EventSubscription {
  const notifications = loadNotificationsModule();
  if (!notifications) {
    return NOOP_SUBSCRIPTION;
  }

  return notifications.addNotificationResponseReceivedListener(listener);
}
