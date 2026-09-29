import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useRef } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";

import { useUnreadNotificationCount } from "@/api/queries/notification";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PillButton } from "@/components/ui/PillButton";
import { layout, palette } from "@/constants/design-tokens";
import { AdherenceSummaryCard } from "./components/AdherenceSummaryCard";
import { DashboardTopHeader } from "./components/DashboardTopHeader";
import { HealthTipCard } from "./components/HealthTipCard";
import { RecentPrescriptionsSection } from "./components/RecentPrescriptionsSection";
import { ScanPrescriptionCard } from "./components/ScanPrescriptionCard";
import { TodayScheduleSection } from "./components/TodayScheduleSection";
import { useDashboardViewModel } from "./useDashboardViewModel";

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const viewModel = useDashboardViewModel();
  const unreadCountQuery = useUnreadNotificationCount();
  const hasUnreadNotification = (unreadCountQuery.data?.unreadCount ?? 0) > 0;
  const refetchDashboardRef = useRef(viewModel.refetch);
  refetchDashboardRef.current = viewModel.refetch;

  useFocusEffect(
    useCallback(() => {
      void refetchDashboardRef.current();
    }, []),
  );

  const handlePressScan = () => {
    router.push("/(detail)/scan/scan");
  };

  const handlePressNotification = () => {
    router.push("/(detail)/notifications");
  };

  const handlePressRecentPrescriptionItem = (prescriptionId: number) => {
    router.push({
      pathname: "/(detail)/dashboard/medication-history",
      params: { prescriptionId: String(prescriptionId) },
    });
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: layout.tabScreenBottomSpacing },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <YStack gap={14}>
        <DashboardTopHeader
          onPressNotification={handlePressNotification}
          hasUnreadNotification={hasUnreadNotification}
        />
        <ScanPrescriptionCard onPress={handlePressScan} />

        {viewModel.isLoading ? (
          <YStack style={styles.feedbackBox} gap={10}>
            <LoadingSpinner accessibilityLabel="대시보드 정보 로딩 중" />
            <Text style={styles.feedbackText}>대시보드 정보를 불러오는 중입니다.</Text>
          </YStack>
        ) : null}

        {viewModel.isError ? (
          <YStack style={styles.feedbackBox} gap={10}>
            <Text style={styles.feedbackText}>대시보드 정보를 불러오지 못했습니다.</Text>
            <PillButton variant="outline" onPress={() => viewModel.refetch()} flex={0}>
              <Text style={styles.retryText}>다시 시도</Text>
            </PillButton>
          </YStack>
        ) : null}

        {!viewModel.isLoading && !viewModel.isError ? (
          <>
            <AdherenceSummaryCard
              adherenceRate={viewModel.adherenceRate}
              adherenceSummaryText={viewModel.adherenceSummaryText}
            />
            <TodayScheduleSection
              remainingCount={viewModel.scheduleRemainingCount}
              items={viewModel.scheduleCards}
              takingPrescriptionId={viewModel.takingPrescriptionId}
              onPressTake={viewModel.markPrescriptionAsTaken}
            />
            <RecentPrescriptionsSection
              items={viewModel.recentPrescriptions}
              onPressItem={(item) => handlePressRecentPrescriptionItem(item.prescriptionId)}
            />
            <HealthTipCard
              title={viewModel.healthTipTitle}
              description={viewModel.healthTipDescription}
            />
          </>
        ) : null}
      </YStack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
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
});
