import type { Ionicons } from "@expo/vector-icons";

import type { NotificationItem, NotificationType } from "@/api/types";
import { palette } from "@/constants/design-tokens";

export interface NotificationPresentation {
  readonly iconName: keyof typeof Ionicons.glyphMap;
  readonly gradientColors: readonly [string, string];
  readonly showActionBadge: boolean;
}

const DEFAULT_PRESENTATION: NotificationPresentation = {
  iconName: "notifications-outline",
  gradientColors: [palette.blue, palette.purple],
  showActionBadge: false,
};

const PRESENTATION_BY_TYPE: Partial<Record<NotificationType, NotificationPresentation>> = {
  MEDICATION_REMINDER: {
    iconName: "time-outline",
    gradientColors: [palette.green, palette.opal],
    showActionBadge: false,
  },
  MEDICATION_MISSED: {
    iconName: "alert-circle-outline",
    gradientColors: [palette.orange, palette.red_medium],
    showActionBadge: false,
  },
  MEDICATION_COMPLETED: {
    iconName: "checkmark-circle-outline",
    gradientColors: [palette.green, palette.green_deep],
    showActionBadge: false,
  },
  DRUG_INTERACTION_WARNING: {
    iconName: "warning-outline",
    gradientColors: [palette.red_medium, palette.pink],
    showActionBadge: true,
  },
  PRESCRIPTION_ENDING: {
    iconName: "calendar-outline",
    gradientColors: [palette.orange, palette.red_medium],
    showActionBadge: false,
  },
  REPORT_READY: {
    iconName: "medkit-outline",
    gradientColors: [palette.blue, palette.purple],
    showActionBadge: false,
  },
  FAMILY_MEDICATION_REMINDER: {
    iconName: "people-outline",
    gradientColors: [palette.green, palette.opal],
    showActionBadge: false,
  },
  SYSTEM_NOTICE: {
    iconName: "information-circle-outline",
    gradientColors: [palette.blue, palette.blue_strong],
    showActionBadge: false,
  },
};

export function getNotificationPresentation(
  type: NotificationItem["type"],
): NotificationPresentation {
  if (typeof type !== "string") {
    return DEFAULT_PRESENTATION;
  }
  return PRESENTATION_BY_TYPE[type as NotificationType] ?? DEFAULT_PRESENTATION;
}
