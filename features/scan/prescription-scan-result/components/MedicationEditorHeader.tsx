import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "tamagui";
import { palette } from "@/constants/design-tokens";

interface MedicationEditorHeaderProps {
  readonly index: number;
  readonly isExpanded: boolean;
  readonly isCompleteEnabled: boolean;
  readonly onPressEdit: () => void;
  readonly onPressComplete: () => void;
  readonly onPressRemove: () => void;
}

export function MedicationEditorHeader({
  index,
  isExpanded,
  isCompleteEnabled,
  onPressEdit,
  onPressComplete,
  onPressRemove,
}: MedicationEditorHeaderProps) {
  return (
    <View style={styles.headerRow}>
      <Text style={styles.indexText}>약물 {index + 1}</Text>
      <View style={styles.headerActions}>
        {isExpanded ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`약물 ${index + 1} 수정 완료`}
            onPress={onPressComplete}
            disabled={!isCompleteEnabled}
            style={({ pressed }) => [
              styles.completeButton,
              !isCompleteEnabled ? styles.disabledButton : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text
              style={[
                styles.completeButtonText,
                !isCompleteEnabled ? styles.disabledButtonText : null,
              ]}
            >
              완료
            </Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`약물 ${index + 1} 수정`}
            onPress={onPressEdit}
            style={({ pressed }) => [styles.editButton, pressed ? styles.pressed : null]}
          >
            <Text style={styles.editButtonText}>수정</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`약물 ${index + 1} 삭제`}
          onPress={onPressRemove}
          style={({ pressed }) => [styles.removeButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.removeButtonText}>삭제</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  indexText: {
    color: palette.black,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  removeButton: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: palette.surface_subtle,
  },
  editButton: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: palette.gray,
  },
  completeButton: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: palette.green,
  },
  removeButtonText: {
    color: palette.red_medium,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  editButtonText: {
    color: palette.purple,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  completeButtonText: {
    color: palette.white,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: palette.border_muted,
  },
  disabledButtonText: {
    color: palette.icon,
  },
  pressed: {
    opacity: 0.8,
  },
});
