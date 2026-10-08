import { Pressable, RefreshControl, ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";
import { PillButton } from "@/components/ui/PillButton";
import { ScreenLoadingView } from "@/components/ui/ScreenLoadingView";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import { FamilyScreenHeader } from "@/features/family/family-screen/components/FamilyScreenHeader";
import { FamilyTodayScheduleCard } from "@/features/family/today-medications/components/FamilyTodayScheduleCard";
import { useFamilyTodayMedicationsViewModel } from "@/features/family/today-medications/useFamilyTodayMedicationsViewModel";

export function FamilyTodayMedicationsScreen() {
  const insets = useSafeAreaInsets();
  const vm = useFamilyTodayMedicationsViewModel();
  if (vm.hasValidFamilyId && vm.isLoading) {
    return <ScreenLoadingView accessibilityLabel="복약 정보 불러오는 중" />;
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
      refreshControl={<RefreshControl refreshing={vm.isRefreshing} onRefresh={vm.handleRefresh} />}
    >
      <YStack gap={16}>
        <FamilyScreenHeader
          title={vm.title}
          subtitle={vm.data?.date ?? "오늘의 복약 정보를 확인하세요"}
          onBack={vm.handleBack}
        />
        {!vm.hasValidFamilyId ? (
          <Text>가족 정보를 확인할 수 없습니다.</Text>
        ) : vm.isLoading ? null : vm.isError ? (
          <YStack gap={12}>
            <Text>가족의 복약 정보를 불러오지 못했습니다.</Text>
            <Pressable accessibilityRole="button" onPress={vm.handleRefresh}>
              <Text style={styles.retry}>다시 시도</Text>
            </Pressable>
          </YStack>
        ) : vm.data ? (
          <YStack gap={12}>
            <SurfaceCard style={styles.summary}>
              <Text style={styles.heading}>
                오늘 복약 이행률 {Math.round(vm.data.summary.completionRate)}%
              </Text>
              <Text style={styles.description}>
                {vm.data.summary.completedCount} / {vm.data.summary.totalCount} 완료
              </Text>
            </SurfaceCard>
            {vm.data.schedules.length === 0 ? (
              <Text style={styles.description}>오늘 예정된 복약 스케줄이 없습니다.</Text>
            ) : (
              vm.data.schedules.map((schedule) => (
                <FamilyTodayScheduleCard
                  key={`${schedule.prescriptionId}-${schedule.takeTime}-${schedule.recordIds.join("-")}`}
                  schedule={schedule}
                />
              ))
            )}
          </YStack>
        ) : null}
        {vm.hasValidFamilyId && !vm.isLoading && !vm.isError && vm.data ? (
          <PillButton
            variant="solid"
            onPress={vm.handleHealthInfo}
            accessibilityLabel="가족의 의료진 제공용 건강정보 보기"
          >
            <Text style={styles.buttonText}>의료진 제공용 건강정보 보기</Text>
          </PillButton>
        ) : null}
      </YStack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  buttonText: { color: palette.white, fontWeight: "700" },
  retry: { color: palette.green_deep },
  heading: { color: palette.black, fontWeight: "700" },
  description: { color: palette.icon },
  content: { paddingHorizontal: 16 },
  summary: { padding: 16, gap: 8 },
});
