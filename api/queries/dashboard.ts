import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchTodayMedicationSchedules, updateMedicationRecord } from "@/api/endpoints/dashboard";
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

interface MarkMedicationRecordsMutationParams {
  readonly recordIds: readonly number[];
  readonly body: UpdateMedicationRecordRequest;
}

interface MarkMedicationRecordsMutationContext {
  readonly previousData: TodayMedicationSchedulesResponse | undefined;
}

function isPromiseRejectedResult<T>(
  result: PromiseSettledResult<T>,
): result is PromiseRejectedResult {
  return result.status === "rejected";
}

export function useMarkMedicationRecordsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recordIds, body }: MarkMedicationRecordsMutationParams) => {
      const results = await Promise.allSettled(
        recordIds.map((recordId) => updateMedicationRecord(recordId, body)),
      );

      const isAllRejected = results.every((result) => result.status === "rejected");
      if (isAllRejected) {
        const firstRejected = results.find(isPromiseRejectedResult);
        throw firstRejected?.reason ?? new Error("복약 완료 처리에 실패했습니다.");
      }

      return results;
    },
    onMutate: async ({ recordIds, body }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.dashboard.todayMedicationSchedules,
      });

      const previousData = queryClient.getQueryData<TodayMedicationSchedulesResponse>(
        queryKeys.dashboard.todayMedicationSchedules,
      );

      if (previousData) {
        queryClient.setQueryData(
          queryKeys.dashboard.todayMedicationSchedules,
          applyOptimisticMedicationRecordsUpdate(previousData, recordIds, body),
        );
      }

      return { previousData } satisfies MarkMedicationRecordsMutationContext;
    },
    onSuccess: (results, variables, context) => {
      if (!context?.previousData) {
        return;
      }

      const successfulRecordIds = variables.recordIds.filter(
        (_, index) => results[index]?.status === "fulfilled",
      );
      const hasPartialFailure = successfulRecordIds.length < variables.recordIds.length;

      if (!hasPartialFailure) {
        return;
      }

      const reconciledData = applyOptimisticMedicationRecordsUpdate(
        context.previousData,
        successfulRecordIds,
        variables.body,
      );

      queryClient.setQueryData(queryKeys.dashboard.todayMedicationSchedules, reconciledData);
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
