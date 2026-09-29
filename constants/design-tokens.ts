import { Platform } from "react-native";

/**
 * 앱 전역 색·폰트의 단일 원본. Tamagui·React Navigation·컴포넌트가 모두 여기서 파생됩니다.
 */
export const palette = {
  text: "#11181C",
  background: "#ffffff",
  tint: "#0a7ea4",
  icon: "#4A5565",
  link: "#0a7ea4",

  // color 설정
  transparent: "transparent",
  white: "#ffffff",
  black: "#364153",
  green: "#00C950",
  light_green: "#B9F8CF",
  blue: "#2B7FFF",
  red: "#DC2626",
  gray: "#F8FAFC",
  dark_gray: "#E5E7EB",
  orange: "#FF4B22",
  purple: "#AD46FF",
  opal: "#00BBA7",
  shadow_base: "#000000",

  // variant 톤 - red (알러지 / 위험)
  red_soft: "#FFC9C9",
  /** 삭제·위험 액션 아웃라인 등 (red_soft보다 대비 강함) */
  red_outline: "#FFA2A2",
  red_medium: "#FB2C36",
  red_strong: "#E7000B",
  red_deep: "#9F0712",
  red_quick_text: "#C10007",

  // variant 톤 - blue (기저질환 / 정보)
  blue_soft: "#BEDBFF",
  blue_strong: "#155DFC",
  blue_deep: "#193CB8",
  blue_quick_text: "#1447E6",

  // variant 톤 - green (활성 / 성공)
  green_soft: "#7BF1A8",
  green_deep: "#00A63E",

  // neutral / input
  input_placeholder: "#64748B",
  border_muted: "#D1D5DC",
  surface_subtle: "#F9FAFB",
  /** 비활성 트랙·구분선 등 중립 표면 (≈ gray-100) */
  surface_neutral: "#F3F4F6",

  // common surface
  surface_card: "rgb(255,255,255)",
  surface_card_border: "rgba(255,255,255,0.3)",
  overlay_white_20: "rgba(255,255,255,0.2)",
  overlay_white_25: "rgba(255,255,255,0.25)",
  overlay_white_50: "rgba(255,255,255,0.5)",
  overlay_white_70: "rgba(255,255,255,0.7)",
  overlay_white_90: "rgba(255,255,255,0.9)",
  overlay_white_92: "rgba(255,255,255,0.92)",
  overlay_blue_20: "rgba(59,130,246,0.2)",
  overlay_black_10: "rgba(0,0,0,0.1)",

  // notice tone
  notice_bg_start: "#FFF7ED",
  notice_bg_end: "#FEFCE8",
  notice_border: "#FFD6A8",
  notice_title: "#9F2D00",
  notice_description: "#CA3500",
  warning_allergy_bg: "#FEF2F2",
  warning_interaction_bg: "#FEFCE8",
  warning_interaction_border: "#FFF085",
  warning_interaction_border_strong: "#FFDF20",
  warning_interaction_title: "#894B00",
  warning_interaction_message: "#A65F00",
  pending_badge_bg: "#FFEDD4",
  pending_badge_text: "#CA3500",
  pending_status_bg: "#FF6900",
  pending_status_bg_end: "#FE9A00",
  pink: "#F6339A",
  warning_badge_bg: "#FFE4E6",
  risk_safe_badge_bg: "#DCFCE7",
  risk_safe_badge_text: "#008236",
  risk_caution_start: "#F0B100",
  risk_caution_badge_bg: "#FEF9C2",
  risk_danger_badge_bg: "#FFE2E2",
  title_emphasis: "#1E2939",
  text_muted: "#6A7282",
  schedule_required_border: "#8EC5FF",
  schedule_upcoming_border: "#BFC7D5",
  schedule_upcoming_start: "#9CA3AF",
  schedule_upcoming_end: "#6B7280",
  map_header_bg: "rgba(255,255,255,0.9)",
  map_list_bg: "#EFF6FF",
  map_search_bg: "#F9FAFB",
  map_search_border: "#E5E7EB",
  map_facility_border: "#E5E7EB",
  map_marker_current: "#155DFC",
  map_marker_pharmacy: "#00A63E",
  map_marker_emergency: "#FB2C36",
  map_webview_background: "#F5F5F5",
  map_data_source_text: "#9810FA",

  // linearGradient 3중첩 설정
  bg_green_line: ["#00C950", "#00BC7D", "#00BBA7"],
  bg_pink_line: ["#EFF6FF", "#FAF5FF", "#FDF2F8"],

  // linearGradient 2중첩 설정 (카드 배경)
  bg_allergy_card: ["#FEF2F2", "#FDF2F8"],
  bg_chronic_card: ["#EFF6FF", "#ECFEFF"],
  bg_family_active_card: ["#F0FDF4", "#ECFDF5"],
  bg_family_manage: ["#F8FAFC", "#EFF6FF"],
  bg_invite_icon: ["#00C950", "#00BC7D"],
  bg_pending_avatar: ["#FF8904", "#F0B100"],
  bg_consultation_card: ["#FAF5FF", "#FDF2F8"],
  bg_achievement_card: ["#F0FDF4", "#ECFDF5"],

  // consultation tone (의사 상담 권장)
  consultation_card_border: "#E9D4FF",
  consultation_card_title: "#6E11B0",
  consultation_card_message: "#8200DB",

  // achievement tone (이번 달 성과)
  achievement_card_title: "#016630",
} as const;

type FontFaces = {
  sans: string;
  serif: string;
  rounded: string;
  mono: string;
};

/**
 * 화면 여백 관련 공통 값. 하드코딩된 매직 넘버 대신 여기서 파생합니다.
 */
export const layout = {
  /**
   * 탭 화면(대시보드/관리/지도/프로필)의 스크롤 콘텐츠 하단 여백.
   * 탭바가 이미 시스템 하단 안전영역(insets.bottom)을 확보하므로 화면에서 추가로 더하지 않는다.
   */
  tabScreenBottomSpacing: 32,
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
}) as FontFaces;
