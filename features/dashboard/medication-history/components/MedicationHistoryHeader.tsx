import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, YStack } from "tamagui";
import { palette } from "@/constants/design-tokens";

const TITLE_FONT_SIZE = 21;

interface MedicationHistoryHeaderProps {
  readonly title: string;
  readonly dateLabel: string;
  readonly onPressBack: () => void;
}

export function MedicationHistoryHeader({
  title,
  dateLabel,
  onPressBack,
}: MedicationHistoryHeaderProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="이전 화면으로 이동"
        onPress={onPressBack}
        style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
      >
        <Ionicons name="arrow-back" size={20} color={palette.black} />
      </Pressable>
      <YStack gap={2} style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.dateText}>{dateLabel}</Text>
      </YStack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.6,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: palette.black,
    fontSize: TITLE_FONT_SIZE,
    lineHeight: 28,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  dateText: {
    color: palette.icon,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
});
