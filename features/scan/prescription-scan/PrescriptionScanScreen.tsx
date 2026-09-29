import { router } from "expo-router";
import { useEffect } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";
import { GradientCard } from "@/components/ui/GradientCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { palette } from "@/constants/design-tokens";
import { PrescriptionFrameCard } from "./components/PrescriptionFrameCard";
import { PrescriptionScanActions } from "./components/PrescriptionScanActions";
import { PrescriptionScanHeader } from "./components/PrescriptionScanHeader";
import { usePrescriptionScanViewModel } from "./usePrescriptionScanViewModel";

export function PrescriptionScanScreen() {
  const insets = useSafeAreaInsets();
  const viewModel = usePrescriptionScanViewModel();

  const handlePressClose = () => {
    router.replace("/(tabs)/dashboard");
  };

  useEffect(() => {
    if (!viewModel.error) return;
    Alert.alert("처방전 스캔 오류", viewModel.error.message, [
      {
        text: "확인",
        onPress: () => viewModel.resetError(),
      },
    ]);
  }, [viewModel.error, viewModel.resetError]);

  const isBusy = viewModel.isExtracting || viewModel.isSubmitting;

  return (
    <YStack style={styles.screen}>
      <GradientCard
        gradientColors={palette.bg_pink_line}
        style={{ ...StyleSheet.absoluteFillObject }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View />
      </GradientCard>

      <YStack style={{ paddingTop: insets.top }}>
        <PrescriptionScanHeader onPressClose={handlePressClose} />
      </YStack>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap={12}>
          <PrescriptionFrameCard
            imageUri={viewModel.selectedImageUri}
            onPressManualInput={viewModel.openManualInput}
          />
        </YStack>
      </ScrollView>
      <PrescriptionScanActions
        isBusy={isBusy}
        onPressGallery={viewModel.extractFromGallery}
        onPressCamera={viewModel.extractFromCamera}
        bottomInset={insets.bottom}
      />
      {viewModel.isExtracting ? (
        <View style={styles.extractingOverlay}>
          <YStack style={styles.extractingDialog} gap={10}>
            <LoadingSpinner accessibilityLabel="OCR 텍스트 추출 중" />
            <Text style={styles.feedbackText}>OCR로 텍스트를 추출하는 중입니다.</Text>
          </YStack>
        </View>
      ) : null}
    </YStack>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
  },
  extractingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.overlay_white_90,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  extractingDialog: {
    minWidth: 220,
    paddingHorizontal: 18,
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: palette.surface_card,
    borderWidth: 1,
    borderColor: palette.border_muted,
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackText: {
    color: palette.black,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  retryText: {
    color: palette.green_deep,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
});
