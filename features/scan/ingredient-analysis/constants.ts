import type { AnalysisRiskLevel } from "@/api/types";
import { palette } from "@/constants/design-tokens";
import type { RiskTone } from "./types";

export const RISK_TONE_BY_LEVEL: Record<AnalysisRiskLevel, RiskTone> = {
  SAFE: {
    label: "안전",
    startColor: palette.green,
    endColor: palette.opal,
    badgeBackground: palette.risk_safe_badge_bg,
    badgeTextColor: palette.risk_safe_badge_text,
  },
  CAUTION: {
    label: "주의",
    startColor: palette.risk_caution_start,
    endColor: palette.pending_status_bg,
    badgeBackground: palette.risk_caution_badge_bg,
    badgeTextColor: palette.warning_interaction_message,
  },
  DANGER: {
    label: "위험",
    startColor: palette.red_medium,
    endColor: palette.pink,
    badgeBackground: palette.risk_danger_badge_bg,
    badgeTextColor: palette.red_quick_text,
  },
};
