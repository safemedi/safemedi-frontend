import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "tamagui";
import { GradientCard } from "@/components/ui/GradientCard";
import { palette } from "@/constants/design-tokens";

const CONTAINER_MIN_BOTTOM_PADDING = 12;

interface PrescriptionScanActionsProps {
  readonly isBusy: boolean;
  readonly onPressGallery: () => void;
  readonly onPressCamera: () => void;
  readonly bottomInset: number;
}

const GALLERY_GRADIENT = [palette.blue, palette.purple] as const;
const CAMERA_GRADIENT = [palette.green, palette.opal] as const;

function ActionButton({
  label,
  icon,
  disabled,
  gradientColors,
  onPress,
}: {
  readonly label: string;
  readonly icon: ReactNode;
  readonly disabled: boolean;
  readonly gradientColors: readonly [string, string];
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.actionPressable, (disabled || pressed) && styles.pressed]}
    >
      <GradientCard gradientColors={gradientColors} style={styles.actionGradient}>
        <View style={styles.actionContent}>
          {icon}
          <Text style={styles.actionLabel}>{label}</Text>
        </View>
      </GradientCard>
    </Pressable>
  );
}

export function PrescriptionScanActions({
  isBusy,
  onPressGallery,
  onPressCamera,
  bottomInset,
}: PrescriptionScanActionsProps) {
  return (
    <View
      testID="prescription-scan-actions"
      style={[
        styles.container,
        { paddingBottom: Math.max(bottomInset, CONTAINER_MIN_BOTTOM_PADDING) },
      ]}
    >
      <View style={styles.row}>
        <ActionButton
          label="갤러리"
          disabled={isBusy}
          gradientColors={GALLERY_GRADIENT}
          onPress={onPressGallery}
          icon={<Ionicons name="images" size={14} color={palette.white} />}
        />
        <ActionButton
          label="촬영하기"
          disabled={isBusy}
          gradientColors={CAMERA_GRADIENT}
          onPress={onPressCamera}
          icon={<MaterialIcons name="camera-alt" size={14} color={palette.white} />}
        />
      </View>
      <Text style={styles.caption}>처방전, 약봉투, 약품 설명서를 스캔할 수 있어요</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: palette.dark_gray,
    backgroundColor: palette.overlay_white_90,
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  actionPressable: {
    flex: 1,
  },
  actionGradient: {
    borderRadius: 12,
    minHeight: 50,
    justifyContent: "center",
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionLabel: {
    color: palette.white,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  caption: {
    color: palette.input_placeholder,
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  pressed: {
    opacity: 0.8,
  },
});
