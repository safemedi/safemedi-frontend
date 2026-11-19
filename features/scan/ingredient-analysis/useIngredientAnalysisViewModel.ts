import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import { getApiErrorMessage } from "@/api/error";
import { useAnalyzeIngredientsMutation } from "@/api/queries/ingredient-analysis";
import { useCreatePrescriptionByScanMutation } from "@/api/queries/prescription-scan";
import type { AnalyzeIngredientsResponse } from "@/api/types";
import { useSessionStore } from "@/stores/sessionStore";
import { usePrescriptionDraftStore } from "../prescription-scan/usePrescriptionDraftStore";
import type { IngredientAnalysisViewModel } from "./types";
import { useIngredientAnalysisStore } from "./useIngredientAnalysisStore";

const EMPTY_REQUEST_ERROR = "분석할 약물 정보가 없습니다. 스캔 결과 화면으로 이동합니다.";

export function useIngredientAnalysisViewModel(): IngredientAnalysisViewModel {
  const request = useIngredientAnalysisStore((state) => state.request);
  const clearRequest = useIngredientAnalysisStore((state) => state.clearRequest);
  const clearDraftResult = usePrescriptionDraftStore((state) => state.clearResult);
  const analyzeMutation = useAnalyzeIngredientsMutation();
  const createMutation = useCreatePrescriptionByScanMutation();
  const isConfirmingRef = useRef(false);
  const isSubmitting = createMutation.isPending;
  const shouldIgnoreMissingRequestAlertRef = useRef<boolean>(false);
  const [result, setResult] = useState<AnalyzeIngredientsResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isCurrentRequest = useCallback(
    () => !!request && useIngredientAnalysisStore.getState().request === request,
    [request],
  );

  const runIngredientAnalysis = useCallback(async () => {
    if (!request || !isCurrentRequest() || analyzeMutation.isPending) {
      return;
    }

    try {
      const sessionVersion = useSessionStore.getState().sessionVersion;
      const response = await analyzeMutation.mutateAsync({ body: request, sessionVersion });
      if (!isCurrentRequest()) return;
      setResult(response);
      setErrorMessage(null);
    } catch (error) {
      const message = await getApiErrorMessage(error, "성분 분석 결과를 불러오지 못했습니다.");
      if (isCurrentRequest()) setErrorMessage(message);
    }
  }, [analyzeMutation, isCurrentRequest, request]);

  useEffect(() => {
    if (!request && !shouldIgnoreMissingRequestAlertRef.current) {
      Alert.alert("성분 분석 정보 없음", EMPTY_REQUEST_ERROR, [
        { text: "확인", onPress: () => router.replace("/(detail)/scan/scan-result") },
      ]);
    }
  }, [request]);

  useEffect(() => {
    if (!request || result || errorMessage || analyzeMutation.isPending) {
      return;
    }

    void runIngredientAnalysis();
  }, [analyzeMutation.isPending, errorMessage, request, result, runIngredientAnalysis]);

  const handlePressClose = useCallback(() => {
    if (isSubmitting || isConfirmingRef.current) return;
    shouldIgnoreMissingRequestAlertRef.current = true;
    clearRequest();
    router.replace("/(tabs)/dashboard");
  }, [clearRequest, isSubmitting]);

  const handlePressCancel = useCallback(() => {
    if (isSubmitting || isConfirmingRef.current) return;
    shouldIgnoreMissingRequestAlertRef.current = true;
    clearRequest();
    router.back();
  }, [clearRequest, isSubmitting]);

  const handlePressRetryAnalysis = useCallback(async () => {
    if (!request) {
      return;
    }

    setErrorMessage(null);
    setResult(null);
    await runIngredientAnalysis();
  }, [request, runIngredientAnalysis]);

  const handlePressConfirm = useCallback(async () => {
    if (!request || !isCurrentRequest() || isSubmitting || isConfirmingRef.current) {
      return;
    }

    isConfirmingRef.current = true;
    try {
      const sessionVersion = useSessionStore.getState().sessionVersion;
      const response = await createMutation.mutateAsync({
        body: { ...request, isDoctorApproved: true },
        sessionVersion,
      });
      if (!isCurrentRequest()) return;
      const allergyWarnings = response.allergyWarnings ?? [];
      const hasAllergyConflict = response.hasAllergyConflict ?? false;
      const warningMessages = allergyWarnings.map((item) => item.warningMessage).join("\n");
      const feedbackMessage = hasAllergyConflict
        ? `${response.message}\n${warningMessages}`
        : response.message;

      Alert.alert(hasAllergyConflict ? "알레르기 주의" : "복약 등록 완료", feedbackMessage, [
        {
          text: "확인",
          onPress: () => {
            if (!isCurrentRequest()) return;
            shouldIgnoreMissingRequestAlertRef.current = true;
            clearRequest();
            clearDraftResult();
            router.replace("/(tabs)/dashboard");
          },
        },
      ]);
    } catch (error) {
      const message = await getApiErrorMessage(
        error,
        "복약 등록에 실패했습니다. 잠시 후 다시 시도해주세요.",
      );
      if (isCurrentRequest()) Alert.alert("복약 등록 실패", message);
    } finally {
      isConfirmingRef.current = false;
    }
  }, [clearDraftResult, clearRequest, createMutation, isCurrentRequest, isSubmitting, request]);

  return useMemo(
    () => ({
      request,
      result: request ? result : null,
      isAnalyzing: analyzeMutation.isPending || (!!request && !result && !errorMessage),
      isSubmitting,
      errorMessage,
      handlePressClose,
      handlePressCancel,
      handlePressRetryAnalysis,
      handlePressConfirm,
    }),
    [
      analyzeMutation.isPending,
      isSubmitting,
      errorMessage,
      handlePressCancel,
      handlePressClose,
      handlePressConfirm,
      handlePressRetryAnalysis,
      request,
      result,
    ],
  );
}
