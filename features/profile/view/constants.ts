import { palette } from "@/constants/design-tokens";

export type HealthInfoVariant = "allergy" | "chronic";

export type HealthInfoStyle = {
  borderColor: string;
  gradientColors: readonly [string, string];
  titleColor: string;
  badgeColor: string;
  editTextColor: string;
};

export const HEALTH_INFO_STYLES: Record<HealthInfoVariant, HealthInfoStyle> = {
  allergy: {
    borderColor: palette.red_soft,
    gradientColors: palette.bg_allergy_card,
    titleColor: palette.red_deep,
    badgeColor: palette.red_medium,
    editTextColor: palette.red_strong,
  },
  chronic: {
    borderColor: palette.blue_soft,
    gradientColors: palette.bg_chronic_card,
    titleColor: palette.blue_deep,
    badgeColor: palette.blue,
    editTextColor: palette.blue_strong,
  },
};

export const FAMILY_ACTIVE_STYLE = {
  borderColor: palette.green_soft,
  gradientColors: palette.bg_family_active_card,
  activeTextColor: palette.green_deep,
};

export const FAMILY_AVATAR_GRADIENTS = {
  green: [palette.green, palette.opal] as const,
  purple: [palette.blue, palette.purple] as const,
};
