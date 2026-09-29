/** 알림 유형 (서버 NotificationType) */
export type NotificationType =
  | "MEDICATION_REMINDER"
  | "MEDICATION_MISSED"
  | "MEDICATION_COMPLETED"
  | "DRUG_INTERACTION_WARNING"
  | "PRESCRIPTION_ENDING"
  | "REPORT_READY"
  | "FAMILY_MEDICATION_REMINDER"
  | "SYSTEM_NOTICE";

/** 알림 이동 대상 유형 */
export type NotificationTargetType = "MEDICATION_RECORD" | "PRESCRIPTION" | "REPORT";

/** GET/PATCH /api/v1/users/notification-settings 응답 */
export type NotificationSettings = {
  isMyReminderOn: boolean;
  isFamilyReminderOn: boolean;
  isMissedAlertOn: boolean;
};

/** GET /api/v1/notifications content 항목 */
export type NotificationItem = {
  notificationId: number;
  type: NotificationType | string;
  title: string;
  message: string;
  isRead: boolean;
  targetType: NotificationTargetType | null;
  targetId: number | null;
  createdAt: string;
};

/** GET /api/v1/notifications 응답 */
export type NotificationListResponse = {
  content: NotificationItem[];
  page: number;
  size: number;
  isLast: boolean;
};

/** GET /api/v1/notifications/unread-count 응답 */
export type NotificationUnreadCountResponse = {
  unreadCount: number;
};

/** PATCH /api/v1/notifications/{id}/read 응답 */
export type NotificationReadResponse = {
  notificationId: number;
  isRead: boolean;
};

/** PATCH /api/v1/notifications/read-all 응답 */
export type NotificationReadAllResponse = {
  updatedCount: number;
};

export type DeviceType = "IOS" | "ANDROID";

/** POST /api/v1/users/device-token 요청 */
export type RegisterDeviceTokenBody = {
  deviceToken: string;
  deviceType: DeviceType;
};

/** POST /api/v1/users/device-token 응답 */
export type RegisterDeviceTokenResponse = {
  deviceId: number;
  message: string;
};
