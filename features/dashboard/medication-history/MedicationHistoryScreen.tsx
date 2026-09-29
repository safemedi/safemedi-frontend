import { router, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { Alert, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PillButton } from "@/components/ui/PillButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import { useScreenBottomPadding } from "@/hooks/useScreenBottomPadding";
import { MedicationHistoryCard } from "./components/MedicationHistoryCard";
import { MedicationHistoryHeader } from "./components/MedicationHistoryHeader";
import { MedicationWarningBanner } from "./components/MedicationWarningBanner";
import { useMedicationHistoryViewModel } from "./useMedicationHistoryViewModel";

const SCREEN_TITLE = "스캔 기록 상세";

export function MedicationHistoryScreen() {
  const insets = useSafeAreaInsets();
  const bottomPadding = useScreenBottomPadding(24);
  const params = useLocalSearchParams();
  const prescriptionIdParam =
    typeof params.prescriptionId === "string" ? params.prescriptionId : undefined;
  const viewModel = useMedicationHistoryViewModel(prescriptionIdParam);

  const handlePressApprove = useCallback(() => {
    Alert.alert("의사 상담 후 승인", "이번 버전에서는 승인 기능이 준비 중입니다.");
  }, []);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 14, paddingBottom: bottomPadding },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <YStack gap={14}>
        <MedicationHistoryHeader
          title={SCREEN_TITLE}
          dateLabel={viewModel.displayDate}
          onPressBack={() => router.back()}
        />

        {viewModel.warningSummary ? (
          <MedicationWarningBanner description={viewModel.warningSummary} />
        ) : null}

        <SectionHeader title="등록된 약물" />

        {viewModel.isLoading ? (
          <YStack style={styles.feedbackBox} gap={10}>
            <LoadingSpinner accessibilityLabel="복약 등록 기록 로딩 중" />
            <Text style={styles.feedbackText}>복약 등록 기록을 불러오는 중입니다.</Text>
          </YStack>
        ) : null}

        {viewModel.isError ? (
          <YStack style={styles.feedbackBox} gap={10}>
            <Text style={styles.feedbackText}>복약 등록 기록을 불러오지 못했습니다.</Text>
            <PillButton variant="outline" onPress={() => viewModel.refetch()} flex={0}>
              <Text style={styles.retryText}>다시 시도</Text>
            </PillButton>
          </YStack>
        ) : null}

        {!viewModel.isLoading && !viewModel.isError ? (
          viewModel.medications.length > 0 ? (
            <YStack gap={10}>
              {viewModel.medications.map((medication) => (
                <MedicationHistoryCard
                  key={medication.id}
                  medication={medication}
                  onPressApprove={handlePressApprove}
                />
              ))}
            </YStack>
          ) : (
            <SurfaceCard style={styles.emptyCard}>
              <Text style={styles.emptyText}>등록된 복약 기록이 없습니다.</Text>
            </SurfaceCard>
          )
        ) : null}
      </YStack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
  },
  feedbackBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 42,
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
  emptyCard: {
    paddingVertical: 22,
    paddingHorizontal: 14,
  },
  emptyText: {
    color: palette.icon,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    fontWeight: "500",
  },
});
