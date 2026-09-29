import { palette } from "@/constants/design-tokens";
import { profileEditQuickItems } from "@/constants/health-profile-options";

export type ProfileEditSectionVariant = "allergy" | "chronic";

type ProfileEditSectionStyle = {
  tagBackground: string;
  quickTagBackground: string;
  quickTagBorder: string;
  quickTagText: string;
  addButtonGradient: readonly [string, string];
};

export const PROFILE_EDIT_SECTION_STYLES: Record<
  ProfileEditSectionVariant,
  ProfileEditSectionStyle
> = {
  allergy: {
    tagBackground: palette.red_medium,
    quickTagBackground: palette.bg_allergy_card[0],
    quickTagBorder: palette.red_soft,
    quickTagText: palette.red_quick_text,
    addButtonGradient: [palette.red_medium, palette.pink] as const,
  },
  chronic: {
    tagBackground: palette.blue,
    quickTagBackground: palette.bg_chronic_card[0],
    quickTagBorder: palette.blue_soft,
    quickTagText: palette.blue_quick_text,
    addButtonGradient: [palette.blue, palette.purple] as const,
  },
};

export const PROFILE_EDIT_QUICK_ITEMS = profileEditQuickItems as Record<
  ProfileEditSectionVariant,
  readonly string[]
>;
