import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type {
  NotificationListResponse,
  NotificationReadAllResponse,
  NotificationReadResponse,
  NotificationSettings,
  NotificationUnreadCountResponse,
} from "@/api/types/notification";

export interface FetchNotificationsParams {
  readonly page?: number;
  readonly size?: number;
}

export async function fetchNotifications(
  params: FetchNotificationsParams = {},
): Promise<NotificationListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) {
    searchParams.set("page", String(params.page));
  }
  if (params.size !== undefined) {
    searchParams.set("size", String(params.size));
  }

  const query = searchParams.toString();
  const path = query ? `${apiPaths.notifications}?${query}` : apiPaths.notifications;
  return api.get(path).json<NotificationListResponse>();
}

export async function fetchUnreadNotificationCount(): Promise<NotificationUnreadCountResponse> {
  return api.get(apiPaths.notificationsUnreadCount).json<NotificationUnreadCountResponse>();
}

export async function patchNotificationRead(
  notificationId: number,
): Promise<NotificationReadResponse> {
  return api.patch(apiPaths.notificationRead(notificationId)).json<NotificationReadResponse>();
}

export async function patchAllNotificationsRead(): Promise<NotificationReadAllResponse> {
  return api.patch(apiPaths.notificationsReadAll).json<NotificationReadAllResponse>();
}

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  return api.get(apiPaths.notificationsSettings).json<NotificationSettings>();
}

export async function patchNotificationSettings(
  body: Partial<
    Pick<NotificationSettings, "isMyReminderOn" | "isFamilyReminderOn" | "isMissedAlertOn">
  >,
): Promise<NotificationSettings> {
  return api.patch(apiPaths.notificationsSettings, { json: body }).json<NotificationSettings>();
}
