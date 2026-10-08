import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";
import { GradientCard } from "@/components/ui/GradientCard";
import { PillButton } from "@/components/ui/PillButton";
import { ScreenLoadingView } from "@/components/ui/ScreenLoadingView";
import { palette } from "@/constants/design-tokens";
import { PrescriptionScanHeader } from "@/features/scan/prescription-scan/components/PrescriptionScanHeader";
import { AnalysisSummaryCard } from "./components/AnalysisSummaryCard";
import { DoctorConsultationCard } from "./components/DoctorConsultationCard";
import { MedicationAnalysisCard } from "./components/MedicationAnalysisCard";
import { RISK_TONE_BY_LEVEL } from "./constants";
import { useIngredientAnalysisViewModel } from "./useIngredientAnalysisViewModel";

export function IngredientAnalysisScreen() {
  const insets = useSafeAreaInsets();
  const viewModel = useIngredientAnalysisViewModel();

  const medicationCount = viewModel.result?.analyzedMedicationCount ?? 0;
  const summary = viewModel.result?.summary;
  const isConfirmDisabled =
    viewModel.isSubmitting ||
    viewModel.isAnalyzing ||
    !viewModel.result ||
    Boolean(viewModel.errorMessage);
  const confirmButtonLabel = viewModel.isSubmitting
    ? "등록 중..."
    : !viewModel.result || viewModel.errorMessage
      ? "분석 결과 필요"
      : viewModel.result.shouldConsultDoctor
        ? "의사 확인 필요"
        : "복약 등록 완료";

  if (viewModel.isAnalyzing) {
    return (
      <ScreenLoadingView
        accessibilityLabel="약물 성분 분석 중"
        message="약물 성분을 분석하는 중입니다."
      />
    );
  }

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
        <PrescriptionScanHeader onPressClose={viewModel.handlePressClose} title="성분 분석 결과" />
      </YStack>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap={12}>
          {viewModel.errorMessage ? (
            <YStack gap={10}>
              <DoctorConsultationCard
                message={`분석 결과를 불러오지 못했습니다. ${viewModel.errorMessage}`}
              />
              <PillButton
                variant="outline"
                onPress={viewModel.handlePressRetryAnalysis}
                accessibilityLabel="성분 분석 다시 시도"
                borderColor={palette.border_muted}
                backgroundColor={palette.surface_subtle}
                disabled={viewModel.isAnalyzing}
              >
                <Text style={styles.retryText}>
                  {viewModel.isAnalyzing ? "재시도 중..." : "다시 시도"}
                </Text>
              </PillButton>
            </YStack>
          ) : null}

          {summary ? (
            <AnalysisSummaryCard
              analyzedMedicationCount={medicationCount}
              dangerCount={summary.dangerCount}
              cautionCount={summary.cautionCount}
              safeCount={summary.safeCount}
            />
          ) : null}

          {viewModel.result?.medications.map((medication) => (
            <MedicationAnalysisCard
              key={`${medication.atcCode}-${medication.drugName}`}
              medication={{
                ...medication,
                riskLabel: RISK_TONE_BY_LEVEL[medication.riskLevel].label,
              }}
            />
          ))}

          {viewModel.result?.shouldConsultDoctor && viewModel.result.doctorConsultationMessage ? (
            <DoctorConsultationCard message={viewModel.result.doctorConsultationMessage} />
          ) : null}
        </YStack>
      </ScrollView>

      <View style={[styles.bottomActionBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.bottomActionRow}>
          <PillButton
            variant="outline"
            onPress={viewModel.handlePressCancel}
            accessibilityLabel="분석 취소"
            borderColor={palette.border_muted}
            backgroundColor={palette.surface_subtle}
          >
            <Text style={styles.cancelText}>취소</Text>
          </PillButton>
          <PillButton
            variant="solid"
            onPress={viewModel.handlePressConfirm}
            accessibilityLabel="복약 등록 확정"
            backgroundColor={palette.green}
            disabled={isConfirmDisabled}
          >
            <Text style={styles.confirmText}>{confirmButtonLabel}</Text>
          </PillButton>
        </View>
      </View>
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
    paddingBottom: 24,
  },
  bottomActionBar: {
    borderTopWidth: 1,
    borderTopColor: palette.dark_gray,
    backgroundColor: palette.overlay_white_90,
    paddingTop: 10,
    paddingHorizontal: 14,
  },
  bottomActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  cancelText: {
    color: palette.black,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  retryText: {
    color: palette.black,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  confirmText: {
    color: palette.white,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
});
