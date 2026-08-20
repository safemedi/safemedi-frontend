import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchTodayMedicationSchedules, updateMedicationRecords } from "@/api/endpoints/dashboard";
import { applyOptimisticMedicationRecordsUpdate } from "@/api/queries/optimisticTodayMedicationSchedules";
import { queryKeys } from "@/api/query-keys";
import type {
  TodayMedicationSchedulesResponse,
  UpdateMedicationRecordRequest,
} from "@/api/types/dashboard";
import { useSessionStore } from "@/stores/sessionStore";

const STALE_MS = 60 * 1000;

async function invalidateMedicationRecordQueries(
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.todayMedicationSchedules,
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.medications.all,
    }),
  ]);
}

export function useDashboardTodayMedicationSchedules() {
  const accessToken = useSessionStore((state) => state.accessToken);

  return useQuery({
    queryKey: queryKeys.dashboard.todayMedicationSchedules,
    enabled: !!accessToken,
    staleTime: STALE_MS,
    queryFn: fetchTodayMedicationSchedules,
  });
}

interface MarkMedicationRecordsMutationContext {
  readonly previousData: TodayMedicationSchedulesResponse | undefined;
}

export function useMarkMedicationRecordsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: UpdateMedicationRecordRequest) => updateMedicationRecords(variables),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.dashboard.todayMedicationSchedules,
      });

      const previousData = queryClient.getQueryData<TodayMedicationSchedulesResponse>(
        queryKeys.dashboard.todayMedicationSchedules,
      );

      if (previousData) {
        queryClient.setQueryData(
          queryKeys.dashboard.todayMedicationSchedules,
          applyOptimisticMedicationRecordsUpdate(previousData, variables.recordIds, variables),
        );
      }

      return { previousData } satisfies MarkMedicationRecordsMutationContext;
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.dashboard.todayMedicationSchedules,
          context.previousData,
        );
      }
    },
    onSettled: async () => {
      await invalidateMedicationRecordQueries(queryClient);
    },
  });
}
