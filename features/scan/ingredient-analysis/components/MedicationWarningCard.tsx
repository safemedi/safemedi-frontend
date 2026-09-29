import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";
import { Text } from "tamagui";
import type { AnalyzeIngredientWarning } from "@/api/types";
import { palette } from "@/constants/design-tokens";

interface MedicationWarningCardProps {
  readonly warning: AnalyzeIngredientWarning;
}

const WARNING_THEME_BY_TYPE = {
  ALLERGY: {
    icon: "warning-outline",
    backgroundColor: palette.warning_allergy_bg,
    borderColor: palette.red_soft,
    titleColor: palette.red_quick_text,
    messageColor: palette.red_strong,
  },
  INTERACTION: {
    icon: "alert-circle-outline",
    backgroundColor: palette.warning_interaction_bg,
    borderColor: palette.warning_interaction_border,
    titleColor: palette.warning_interaction_title,
    messageColor: palette.warning_interaction_message,
  },
} as const;

export function MedicationWarningCard({ warning }: MedicationWarningCardProps) {
  const theme = WARNING_THEME_BY_TYPE[warning.type];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor },
      ]}
    >
      <Ionicons name={theme.icon} size={16} color={theme.titleColor} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.titleColor }]}>{warning.title}</Text>
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
