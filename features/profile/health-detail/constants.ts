import { palette } from "@/constants/design-tokens";

import type { ClinicalAlertItem } from "./types";

export const MEDICAL_GUIDE_TEXT =
  "진료 시 이 정보를 의사에게 보여주시면 안전한 처방을 받을 수 있습니다.";

export const ALLERGY_ITEM_DESCRIPTION = "이 성분이 포함된 약물은 처방을 피해주세요";
export const CHRONIC_ITEM_DESCRIPTION = "복용 약물과의 상호작용을 확인해주세요";
export const EMPTY_ITEM_TEXT = "등록된 정보가 없습니다";

export const PRINT_SUCCESS_MESSAGE = "의료진 확인 정보를 인쇄할 수 있도록 준비 중입니다.";
export const SHARE_SUCCESS_MESSAGE = "의료진 확인 정보를 공유할 수 있도록 준비 중입니다.";

export const ALLERGY_BADGE_LABEL = "경고";
export const CHRONIC_BADGE_LABEL = "주의";
export const EMPTY_BADGE_LABEL = "안내";

export const ALLERGY_HEADER_ICON = "warning-outline";
export const CHRONIC_HEADER_ICON = "medkit-outline";

export const ALERT_TONE_COLORS = {
  danger: {
    titleColor: palette.red_deep,
    subtitleColor: palette.red_strong,
    gradientColors: [...palette.bg_allergy_card] as readonly [string, string],
    borderColor: palette.red_soft,
    indexBackgroundColor: palette.red_medium,
    badgeBackgroundColor: palette.red_medium,
  },
  info: {
    titleColor: palette.blue_deep,
    subtitleColor: palette.blue_strong,
    gradientColors: [...palette.bg_chronic_card] as readonly [string, string],
    borderColor: palette.blue_soft,
    indexBackgroundColor: palette.blue,
    badgeBackgroundColor: palette.blue,
  },
} as const;

export const CLINICIAN_NOTE_ITEMS = [
  "상기 알러지 성분이 포함된 약물 처방을 피해주시기 바랍니다.",
  "기저질환 치료제와의 약물 상호작용을 확인해주시기 바랍니다.",
  "처방 후 부작용 발생 시 즉시 병원을 방문하겠습니다.",
] as const;

export function createIndexedAlertItems(
  items: readonly string[],
  description: string,
  badgeLabel: string,
): readonly ClinicalAlertItem[] {
  return items.map((item, index) => ({
    id: `${item}-${index}`,
    title: item,
    description,
    badgeLabel,
  }));
}
