import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";
import { Text } from "tamagui";
import type { AnalysisWarningType, AnalyzeIngredientWarning } from "@/api/types";
import { palette } from "@/constants/design-tokens";

interface MedicationWarningCardProps {
  readonly warning: AnalyzeIngredientWarning;
}

interface WarningTheme {
  readonly title: string;
  readonly icon: "warning-outline" | "alert-circle-outline";
  readonly backgroundColor: string;
  readonly borderColor: string;
  readonly titleColor: string;
  readonly messageColor: string;
}

const DUR_WARNING_THEME = {
  icon: "alert-circle-outline",
  backgroundColor: palette.warning_interaction_bg,
  borderColor: palette.warning_interaction_border,
  titleColor: palette.warning_interaction_title,
  messageColor: palette.warning_interaction_message,
} as const;

const WARNING_THEME_BY_TYPE = {
  ALLERGY: {
    icon: "warning-outline",
    backgroundColor: palette.warning_allergy_bg,
    borderColor: palette.red_soft,
    titleColor: palette.red_quick_text,
    messageColor: palette.red_strong,
    title: "알레르기 주의",
  },
  INTERACTION: { ...DUR_WARNING_THEME, title: "병용 주의" },
  DUR_ELDERLY: { ...DUR_WARNING_THEME, title: "고령자 복용 주의" },
  DUR_AGE: { ...DUR_WARNING_THEME, title: "연령별 복용 주의" },
  DUR_PREGNANCY: { ...DUR_WARNING_THEME, title: "임신 중 복용 주의" },
  DUR_INTERACTION: { ...DUR_WARNING_THEME, title: "병용 주의" },
} as const satisfies Record<AnalysisWarningType, WarningTheme>;

export function MedicationWarningCard({ warning }: MedicationWarningCardProps) {
  const theme = WARNING_THEME_BY_TYPE[warning.type] ?? { ...DUR_WARNING_THEME, title: "복용 주의" };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor },
      ]}
    >
      <Ionicons name={theme.icon} size={16} color={theme.titleColor} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.titleColor }]}>
          {warning.title?.trim() || theme.title}
        </Text>
        <Text style={[styles.message, { color: theme.messageColor }]}>{warning.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  message: {
    fontSize: 12,
    lineHeight: 17,
  },
});
