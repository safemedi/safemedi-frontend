import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "tamagui";

import { palette } from "@/constants/design-tokens";

export type ProfileEditActionBarProps = {
  onCancel?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
};

export function ProfileEditActionBar({
  onCancel,
  onSubmit,
  isSubmitting = false,
}: ProfileEditActionBarProps) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onCancel} style={styles.cancelButton} testID="profile-edit-cancel-button">
        <Text style={styles.cancelText}>취소</Text>
      </Pressable>
      <Pressable onPress={onSubmit} disabled={isSubmitting} style={styles.submitPressable}>
        <LinearGradient
          colors={[...palette.bg_green_line]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.submitButton, isSubmitting && styles.disabled]}
          testID="profile-edit-submit-button"
        >
          <Text style={styles.submitText}>{isSubmitting ? "저장 중..." : "저장하기"}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border_muted,
    backgroundColor: palette.gray,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
    color: palette.black,
  },
  submitPressable: {
    flex: 1,
  },
  submitButton: {
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
    color: palette.white,
  },
  disabled: {
    opacity: 0.7,
  },
});
