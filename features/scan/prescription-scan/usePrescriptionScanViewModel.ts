import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { getApiErrorMessage } from "@/api/error";
import { useExtractPrescriptionMutation } from "@/api/queries/prescription-scan";
import { pickPrescriptionImage } from "@/features/scan/prescription-scan/prescription-image";
import { usePrescriptionDraftStore } from "@/features/scan/prescription-scan/usePrescriptionDraftStore";

import { useSessionStore } from "@/stores/sessionStore";

export interface PrescriptionScanViewModel {
  readonly isExtracting: boolean;
  readonly error: Error | null;
  readonly selectedImageUri: string | null;
  readonly extractFromGallery: () => Promise<void>;
  readonly extractFromCamera: () => Promise<void>;
  readonly retryExtract: () => Promise<void>;
  readonly openManualInput: () => void;
  readonly resetError: () => void;
}

export function usePrescriptionScanViewModel(): PrescriptionScanViewModel {
  const extraction = useExtractPrescriptionMutation();
  const setResult = usePrescriptionDraftStore((state) => state.setResult);
  const [error, setError] = useState<Error | null>(null);
  const sessionVersion = useSessionStore((state) => state.sessionVersion);
  const [selection, setSelection] = useState<{ imageUri: string; sessionVersion: number } | null>(
    null,
  );
  const selectedImageUri =
    selection?.sessionVersion === sessionVersion ? (selection?.imageUri ?? null) : null;
  const [isExtracting, setIsExtracting] = useState(false);
  const isBusy = useRef(false);
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const runExtraction = async (selectImage: () => Promise<string | null>) => {
    if (isBusy.current) return;
    const originVersion = useSessionStore.getState().sessionVersion;
    isBusy.current = true;
    setIsExtracting(true);
    setError(null);
    setSelection(null);
    try {
      const imageUri = await selectImage();
      if (!imageUri || !isMounted.current) return;
      if (useSessionStore.getState().sessionVersion !== originVersion) return;
      setSelection({ imageUri, sessionVersion: originVersion });
      const response = await extraction.mutateAsync({ imageUri, sessionVersion: originVersion });
      if (!isMounted.current || useSessionStore.getState().sessionVersion !== originVersion) return;
      // 서버 응답을 화면에서 수정할 초안으로 변환한다. 원문 전체는 보관하지 않는다.
      setResult({
        imageUri,
        draft: {
          title: response.title,
          startDate: response.startDate ?? "",
          endDate: response.endDate ?? "",
          isDateRangeConfident: !!response.startDate && !!response.endDate,
          medications: response.medications.map((item) => ({
            drugName: item.drugName,
            drugCode: item.drugCode ?? undefined,
            atcCode: item.atcCode ?? "",
            dailyDoseCount: item.dailyDoseCount ?? undefined,
            instructions: item.instructions ?? undefined,
          })),
        },
      });
      router.replace("/(detail)/scan/scan-result");
    } catch (cause) {
      const message = await getApiErrorMessage(
        cause,
        cause instanceof Error ? cause.message : "사진 분석에 실패했습니다. 다시 시도해 주세요.",
      );
      if (isMounted.current && useSessionStore.getState().sessionVersion === originVersion)
        setError(new Error(message));
    } finally {
      isBusy.current = false;
      if (isMounted.current) {
        setIsExtracting(false);
        extraction.reset();
      }
    }
  };

  return {
    isExtracting,
    error,
    selectedImageUri,
    extractFromGallery: () => runExtraction(() => pickPrescriptionImage("gallery")),
    extractFromCamera: () => runExtraction(() => pickPrescriptionImage("camera")),
    retryExtract: () =>
      runExtraction(async () => {
        if (!selection || selection.sessionVersion !== useSessionStore.getState().sessionVersion)
          throw new Error("다시 시도할 사진을 선택해 주세요.");
        return selection.imageUri;
      }),
    openManualInput: () => {
      if (isBusy.current) return;
      setResult({
        imageUri: "manual://input",
        draft: { title: "", startDate: "", endDate: "", medications: [] },
      });
      router.replace("/(detail)/scan/scan-result");
    },
    resetError: () => setError(null),
  };
}
