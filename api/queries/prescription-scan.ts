import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPrescriptionByScan, extractPrescription } from "@/api/endpoints/prescription-scan";
import { queryKeys } from "@/api/query-keys";
import type { CreatePrescriptionRequest } from "@/api/types";
import { useSessionStore } from "@/stores/sessionStore";

export function useCreatePrescriptionByScanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.scan.createPrescription,
    mutationFn: ({
      body,
      sessionVersion,
    }: {
      body: CreatePrescriptionRequest;
      sessionVersion: number;
    }) => createPrescriptionByScan(body, sessionVersion),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.list });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.todayMedicationSchedules,
      });
    },
  });
}

export function useExtractPrescriptionMutation() {
  return useMutation({
    mutationKey: queryKeys.scan.extractPrescription,
    retry: false,
    gcTime: 1_000,
    mutationFn: async ({
      imageUri,
      sessionVersion,
    }: {
      imageUri: string;
      sessionVersion: number;
    }) => {
      const session = useSessionStore.getState();
      if (!session.accessToken) throw new Error("로그인이 필요합니다.");
      if (session.sessionVersion !== sessionVersion) {
        throw new Error("로그인 상태가 변경되었습니다. 다시 시도해 주세요.");
      }
      const response = await extractPrescription(imageUri, sessionVersion);
      if (useSessionStore.getState().sessionVersion !== sessionVersion) {
        throw new Error("로그인 상태가 변경되었습니다. 다시 시도해 주세요.");
      }
      return response;
    },
  });
}
