import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import { getApiErrorMessage } from "@/api/error";
import { useAnalyzeIngredientsMutation } from "@/api/queries/ingredient-analysis";
import { useCreatePrescriptionByScanMutation } from "@/api/queries/prescription-scan";
import type { AnalyzeIngredientsResponse } from "@/api/types";
import { usePrescriptionOcrResultStore } from "../prescription-scan/usePrescriptionOcrResultStore";
import type { IngredientAnalysisViewModel } from "./types";
import { useIngredientAnalysisStore } from "./useIngredientAnalysisStore";

const EMPTY_REQUEST_ERROR = "분석할 약물 정보가 없습니다. 스캔 결과 화면으로 이동합니다.";

export function useIngredientAnalysisViewModel(): IngredientAnalysisViewModel {
  const request = useIngredientAnalysisStore((state) => state.request);
  const clearRequest = useIngredientAnalysisStore((state) => state.clearRequest);
  const clearOcrResult = usePrescriptionOcrResultStore((state) => state.clearResult);
  const analyzeMutation = useAnalyzeIngredientsMutation();
  const createMutation = useCreatePrescriptionByScanMutation();
  const shouldIgnoreMissingRequestAlertRef = useRef<boolean>(false);
  const [result, setResult] = useState<AnalyzeIngredientsResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runIngredientAnalysis = useCallback(async () => {
    if (!request || analyzeMutation.isPending) {
      return;
    }

    try {
      const response = await analyzeMutation.mutateAsync(request);
      setResult(response);
      setErrorMessage(null);
    } catch (error) {
      const message = await getApiErrorMessage(error, "성분 분석 결과를 불러오지 못했습니다.");
      setErrorMessage(message);
    }
  }, [analyzeMutation, request]);

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
    shouldIgnoreMissingRequestAlertRef.current = true;
    clearRequest();
    router.replace("/(tabs)/dashboard");
  }, [clearRequest]);

  const handlePressCancel = useCallback(() => {
    router.back();
  }, []);

  const handlePressRetryAnalysis = useCallback(async () => {
    if (!request) {
      return;
    }

    setErrorMessage(null);
    setResult(null);
    await runIngredientAnalysis();
  }, [request, runIngredientAnalysis]);

  const handlePressConfirm = useCallback(async () => {
    if (!request) {
      return;
    }

    try {
      const response = await createMutation.mutateAsync({ ...request, isDoctorApproved: true });
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
            shouldIgnoreMissingRequestAlertRef.current = true;
            clearRequest();
            clearOcrResult();
            router.replace("/(tabs)/dashboard");
          },
        },
      ]);
    } catch (error) {
      const message = await getApiErrorMessage(
        error,
        "복약 등록에 실패했습니다. 잠시 후 다시 시도해주세요.",
      );
      Alert.alert("복약 등록 실패", message);
    }
  }, [clearOcrResult, clearRequest, createMutation, request]);

  return useMemo(
    () => ({
      request,
      result,
      isAnalyzing: analyzeMutation.isPending,
      isSubmitting: createMutation.isPending,
      errorMessage,
      handlePressClose,
      handlePressCancel,
      handlePressRetryAnalysis,
      handlePressConfirm,
    }),
    [
      analyzeMutation.isPending,
      createMutation.isPending,
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
