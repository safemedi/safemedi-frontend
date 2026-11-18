import type { FirebaseMessagingTypes } from "@react-native-firebase/messaging";

type MessagingModule = typeof import("@react-native-firebase/messaging");

// Android와 Firebase가 없는 이전 개발 빌드에서 모듈을 미리 초기화하지 않는다.
function loadMessaging(): MessagingModule {
  return require("@react-native-firebase/messaging") as MessagingModule;
}

export function isIosFcmAvailable(): boolean {
  try {
    loadMessaging().getMessaging();
    return true;
  } catch {
    return false;
  }
}

export async function requestIosFcmPermission(): Promise<boolean> {
  const api = loadMessaging();
  const status = await api.requestPermission(api.getMessaging());
  return (
    status === api.AuthorizationStatus.AUTHORIZED ||
    status === api.AuthorizationStatus.PROVISIONAL ||
    status === api.AuthorizationStatus.EPHEMERAL
  );
}

export async function getIosFcmToken(): Promise<string> {
  const api = loadMessaging();
  const messaging = api.getMessaging();
  if (!messaging.isDeviceRegisteredForRemoteMessages) {
    await api.registerDeviceForRemoteMessages(messaging);
  }
  return api.getToken(messaging);
}

export function subscribeIosFcmTokenRefresh(listener: (token: string) => void): () => void {
  const api = loadMessaging();
  return api.onTokenRefresh(api.getMessaging(), listener);
}

export function subscribeIosFcmMessage(listener: () => void): () => void {
  const api = loadMessaging();
  return api.onMessage(api.getMessaging(), listener);
}

export function subscribeIosFcmResponse(listener: () => void): () => void {
  const api = loadMessaging();
  const messaging = api.getMessaging();
  let isActive = true;
  const unsubscribe = api.onNotificationOpenedApp(messaging, listener);
  void api
    .getInitialNotification(messaging)
    .then((message: FirebaseMessagingTypes.RemoteMessage | null) => {
      if (isActive && message) listener();
    })
    .catch(() => {
      // 초기 알림 조회 실패 시 알림 내용이나 토큰을 로그로 노출하지 않는다.
    });
  return () => {
    isActive = false;
    unsubscribe();
  };
}
