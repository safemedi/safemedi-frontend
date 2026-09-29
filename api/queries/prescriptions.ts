import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deletePrescription,
  fetchPrescription,
  fetchPrescriptions,
  updatePrescription,
} from "@/api/endpoints/prescriptions";
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

export function useUpdatePrescriptionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ prescriptionId, body }: UpdatePrescriptionMutationParams) =>
      updatePrescription(prescriptionId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.list });
      await queryClient.invalidateQueries({ queryKey: ["prescriptions", "detail"] });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.todayMedicationSchedules,
      });
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
