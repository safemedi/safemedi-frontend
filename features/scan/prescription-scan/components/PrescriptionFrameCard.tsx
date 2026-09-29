import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "tamagui";
import { palette } from "@/constants/design-tokens";

interface PrescriptionFrameCardProps {
  readonly imageUri: string | null;
  readonly onPressManualInput: () => void;
}

export function PrescriptionFrameCard({
  imageUri,
  onPressManualInput,
}: PrescriptionFrameCardProps) {
  return (
    <View style={styles.frameContainer}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} contentFit="cover" style={styles.image} />
      ) : null}
      <View style={styles.overlay} />
      <View style={styles.cornerTopLeft} />
      <View style={styles.cornerTopRight} />
      <View style={styles.guideWrap}>
        <Text style={styles.guideText}>처방전을 가이드 라인 안에 맞춰주세요</Text>
        <Pressable
          onPress={onPressManualInput}
          accessibilityRole="button"
          accessibilityLabel="직접 입력하기"
          style={({ pressed }) => [styles.manualButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.manualButtonText}>📝 직접 입력하기</Text>
        </Pressable>
      </View>
      <View style={styles.cornerBottomLeft} />
      <View style={styles.cornerBottomRight} />
    </View>
  );
}

const CORNER_SIZE = 28;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  frameContainer: {
    backgroundColor: palette.black,
    borderRadius: 22,
    height: 420,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.overlay_blue_20,
  },
  cornerTopLeft: {
    position: "absolute",
    top: 48,
    left: 26,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: palette.white,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    position: "absolute",
    top: 48,
    right: 26,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: palette.white,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: 48,
    left: 26,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: palette.white,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: 48,
    right: 26,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: palette.white,
    borderBottomRightRadius: 12,
  },
  guideWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 92,
    alignItems: "center",
    gap: 14,
  },
  guideText: {
    color: palette.white,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  manualButton: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
    backgroundColor: palette.overlay_white_20,
    borderWidth: 1,
    borderColor: palette.surface_card_border,
  },
  manualButtonText: {
    color: palette.white,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  pressed: {
    opacity: 0.8,
  },
});
