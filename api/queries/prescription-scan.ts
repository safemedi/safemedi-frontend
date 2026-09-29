import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPrescriptionByScan } from "@/api/endpoints/prescription-scan";
import { queryKeys } from "@/api/query-keys";
import type { CreatePrescriptionRequest } from "@/api/types";

export function useCreatePrescriptionByScanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.scan.createPrescription,
    mutationFn: (body: CreatePrescriptionRequest) => createPrescriptionByScan(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.list });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.todayMedicationSchedules,
      });
    },
  });
}
