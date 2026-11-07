import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deletePrescription,
  fetchPrescription,
  fetchPrescriptions,
  updatePrescription,
} from "@/api/endpoints/prescriptions";
import { invalidateTodaySchedulesAfterWrites } from "@/api/queries/invalidateTodaySchedules";
import { updatePrescriptionTitleOptimistically } from "@/api/queries/optimisticPrescriptionTitle";
import { acquireMutationLock } from "@/api/queries/pendingMutationLocks";
import { queryKeys } from "@/api/query-keys";
import type {
  UpdatePrescriptionRequest,
  UpdatePrescriptionResponse,
} from "@/api/types/prescriptions";
import { useSessionStore } from "@/stores/sessionStore";

const STALE_MS = 60 * 1000;

export function usePrescriptionsQuery() {
  const accessToken = useSessionStore((state) => state.accessToken);

  return useQuery({
    queryKey: queryKeys.prescriptions.list,
    enabled: !!accessToken,
    staleTime: STALE_MS,
    queryFn: () => fetchPrescriptions(),
  });
}

export function usePrescriptionQuery(prescriptionId: number | null) {
  const accessToken = useSessionStore((state) => state.accessToken);

  return useQuery({
    queryKey:
      prescriptionId === null
        ? queryKeys.prescriptions.detail(0)
        : queryKeys.prescriptions.detail(prescriptionId),
    enabled: !!accessToken && prescriptionId !== null,
    staleTime: STALE_MS,
    queryFn: () => fetchPrescription(prescriptionId ?? 0),
  });
}

interface UpdatePrescriptionMutationParams {
  readonly prescriptionId: number;
  readonly body: UpdatePrescriptionRequest;
}

const pendingInvalidations = new WeakMap<QueryClient, Set<() => void>>();

function invalidatePrescriptionsAfterWrites(client: QueryClient, release: () => void): void {
  const pending = pendingInvalidations.get(client);
  if (pending) {
    pending.add(release);
    return;
  }
  const releases = new Set([release]);
  pendingInvalidations.set(client, releases);
  const unsubscribe = client.getMutationCache().subscribe(() => {
    if (client.isMutating({ mutationKey: queryKeys.prescriptions.update }) > 0) return;
    unsubscribe();
    pendingInvalidations.delete(client);
    void Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.prescriptions.list }),
      client.invalidateQueries({ queryKey: ["prescriptions", "detail"] }),
    ])
      .finally(() => {
        for (const unlock of releases) unlock();
      })
      .catch(() => undefined);
  });
}

export function useUpdatePrescriptionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.prescriptions.update,
    mutationFn: ({ prescriptionId, body }: UpdatePrescriptionMutationParams) =>
      updatePrescription(prescriptionId, body),
    onMutate: async ({ prescriptionId, body }) => {
      const release = acquireMutationLock(queryClient, `prescription:${prescriptionId}`);
      try {
        const rollback =
          body.title === undefined
            ? undefined
            : await updatePrescriptionTitleOptimistically(queryClient, prescriptionId, body.title);
        return { release, rollback };
      } catch (error) {
        release();
        throw error;
      }
    },
    onError: (_error, _variables, context) => context?.rollback?.(),
    onSettled: (_data, _error, _variables, context) => {
      if (!context) return;
      invalidateTodaySchedulesAfterWrites(queryClient);
      invalidatePrescriptionsAfterWrites(queryClient, context.release);
    },
  });
}

export function useDeletePrescriptionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prescriptionId: number) => deletePrescription(prescriptionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.list });
      await queryClient.invalidateQueries({ queryKey: ["prescriptions", "detail"] });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.todayMedicationSchedules,
      });
    },
  });
}

export type { UpdatePrescriptionResponse };
