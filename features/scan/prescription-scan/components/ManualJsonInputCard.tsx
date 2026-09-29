import { StyleSheet, TextInput, View } from "react-native";
import { Text } from "tamagui";
import { PillButton } from "@/components/ui/PillButton";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";

interface ManualJsonInputCardProps {
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly onPressApply: () => void;
  readonly onPressCancel: () => void;
}

export function ManualJsonInputCard({
  value,
  onChangeText,
  onPressApply,
  onPressCancel,
}: ManualJsonInputCardProps) {
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>직접 입력</Text>
        <Text style={styles.subtitle}>JSON 형식으로 입력하면 바로 검증 후 반영됩니다.</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        textAlignVertical="top"
        style={styles.input}
        placeholder="JSON 입력"
        placeholderTextColor={palette.input_placeholder}
      />
      <View style={styles.actionRow}>
        <PillButton
          variant="outline"
          onPress={onPressCancel}
          accessibilityLabel="직접 입력 취소"
          flex={1}
        >
          <Text style={styles.cancelText}>취소</Text>
        </PillButton>
        <PillButton
          variant="solid"
          onPress={onPressApply}
          accessibilityLabel="직접 입력 적용"
          backgroundColor={palette.green}
          flex={1}
        >
          <Text style={styles.applyText}>적용</Text>
        </PillButton>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    gap: 12,
  },
  header: {
    gap: 2,
  },
  title: {
    color: palette.black,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  subtitle: {
    color: palette.icon,
    fontSize: 12,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border_muted,
    borderRadius: 12,
    minHeight: 160,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: palette.black,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "monospace",
    backgroundColor: palette.surface_subtle,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  cancelText: {
    color: palette.icon,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  applyText: {
    color: palette.white,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
});
