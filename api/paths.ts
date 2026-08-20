/**
 * SAF-26 API 경로. `baseUrl`은 호스트 루트이며, 여기 값은 `/api/v1/...` 로 시작합니다.
 */
export const apiPaths = {
  authLogin: (provider: "kakao" | "naver") => `/api/v1/auth/login/${provider}`,
  authLogout: "/api/v1/auth/logout",
  authReissue: "/api/v1/auth/reissue",
  usersMeTutorial: "/api/v1/users/me/tutorial",
  usersMe: "/api/v1/users/me",
  usersDeviceToken: "/api/v1/users/device-token",

  families: "/api/v1/families",
  family: (familyId: number | string) => `/api/v1/families/${familyId}`,
  familyInvitations: "/api/v1/family-invitations",
  familyInvitation: (token: string) => `/api/v1/family-invitations/${token}`,
  familyInvitationAccept: (token: string) => `/api/v1/family-invitations/${token}/accept`,

  drugsSearch: "/api/v1/drugs/search",
  drugAllergiesSearch: "/api/v1/allergies/drugs/search",
  diseasesSearch: "/api/v1/diseases/search",

  prescriptions: "/api/v1/prescriptions",
  prescriptionsAnalysis: "/api/v1/prescriptions/analyze",
  prescription: (prescriptionId: number | string) => `/api/v1/prescriptions/${prescriptionId}`,

  medicationRecords: "/api/v1/medication-records",
  medicationRecordsToday: "/api/v1/medication-records/today",

  medicationsStatistics: "/api/v1/medication-records/statistics",

  notifications: "/api/v1/notifications",
  notificationsUnreadCount: "/api/v1/notifications/unread-count",
  notificationsReadAll: "/api/v1/notifications/read-all",
  notificationRead: (notificationId: number | string) =>
    `/api/v1/notifications/${notificationId}/read`,
  notificationsSettings: "/api/v1/users/notification-settings",
  mapFacilities: "/api/v1/map/facilities",
} as const;
