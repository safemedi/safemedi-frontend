import { router, useLocalSearchParams } from "expo-router";
import { useFamilyTodayMedicationSchedules } from "@/api/queries/dashboard";
import type { TodayMedicationSchedulesResponse } from "@/api/types/dashboard";

export interface FamilyTodayMedicationsViewModel {
  readonly title: string;
  readonly hasValidFamilyId: boolean;
  readonly data: TodayMedicationSchedulesResponse | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly isRefreshing: boolean;
  readonly handleRefresh: () => void;
  readonly handleHealthInfo: () => void;
  readonly handleBack: () => void;
}

export function useFamilyTodayMedicationsViewModel(): FamilyTodayMedicationsViewModel {
  const params = useLocalSearchParams<{
    familyId?: string | string[];
    name?: string;
    relation?: string;
  }>();
  const familyId =
    typeof params.familyId === "string" && /^\d+$/.test(params.familyId)
      ? Number(params.familyId)
      : undefined;
  const hasValidFamilyId = familyId !== undefined && Number.isSafeInteger(familyId) && familyId > 0;
  const query = useFamilyTodayMedicationSchedules(hasValidFamilyId ? familyId : undefined);
  const name = typeof params.name === "string" ? params.name : "가족";

  return {
    title: `${name}님의 오늘 복약`,
    hasValidFamilyId,
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isRefreshing: query.isRefetching,
    handleRefresh: () => {
      if (hasValidFamilyId) void query.refetch();
    },
    handleHealthInfo: () => {
      if (!hasValidFamilyId) return;
      router.push({ pathname: "/family/health-info", params: { familyId: String(familyId) } });
    },
    handleBack: () => router.back(),
  };
}
