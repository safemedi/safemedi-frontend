import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { searchDrugs } from "@/api/endpoints/drugs";
import { getApiErrorMessage } from "@/api/error";
import { useCreatePrescriptionByScanMutation } from "@/api/queries/prescription-scan";
import type { CreatePrescriptionRequest, DrugSearchItem } from "@/api/types";
import { extractDraftFromImageSource, extractDraftFromImageUri } from "./device-ocr";
import { isPlaceholderMedication, parsePrescriptionFromJson } from "./ocr-parser";
import type {
  PrescriptionScanViewModel,
  PrescriptionSubmitFeedback,
  ScanMedicationItem,
  ScanPrescriptionDraft,
} from "./types";
import { usePrescriptionOcrResultStore } from "./usePrescriptionOcrResultStore";

const DEFAULT_MANUAL_DRAFT: ScanPrescriptionDraft = {
  title: "",
  startDate: "2026-05-13",
  endDate: "2026-05-20",
  medications: [],
  rawText: "manual",
};
const DEFAULT_MANUAL_JSON = JSON.stringify(DEFAULT_MANUAL_DRAFT, null, 2);
const MANUAL_INPUT_IMAGE_URI = "manual://input";
const JSON_PRETTY_SPACE = 2;
const NO_SELECTED_IMAGE_ERROR = "재시도할 이미지가 없습니다. 먼저 사진을 선택해 주세요.";
const UNKNOWN_OCR_ERROR = "OCR 추출 중 알 수 없는 오류가 발생했습니다.";
const DRUG_MATCH_SEARCH_SIZE = 5;

type OcrImageSource = "camera" | "gallery";

function normalizeUnknownError(error: unknown): Error {
  return error instanceof Error ? error : new Error(UNKNOWN_OCR_ERROR);
}

function normalizeDrugNameForMatch(name: string): string {
  return name.replace(/\s+/g, "").toLowerCase();
}

function findConfidentDrugMatch(
  candidates: readonly DrugSearchItem[],
  ocrDrugName: string,
): DrugSearchItem | undefined {
  const normalizedOcrName = normalizeDrugNameForMatch(ocrDrugName);
  const exactMatch = candidates.find(
    (item) => normalizeDrugNameForMatch(item.drugName) === normalizedOcrName,
  );
  if (exactMatch) {
    return exactMatch;
  }
  // DB 약물명은 제조사·용량이 붙는 경우가 많아(예: OCR "멕시네정" vs DB "OO제약멕시네정10mg")
  // 완전 일치 대신 이름 포함 관계로도 매칭한다. 다만 후보가 여러 개면 어느 게 맞는지
  // 확신할 수 없으므로 자동 매칭하지 않고 사용자가 직접 검색해서 고르도록 남겨둔다.
  const partialMatches = candidates.filter((item) => {
    const normalizedCandidate = normalizeDrugNameForMatch(item.drugName);
    return (
      normalizedCandidate.includes(normalizedOcrName) ||
      normalizedOcrName.includes(normalizedCandidate)
    );
  });
  return partialMatches.length === 1 ? partialMatches[0] : undefined;
}

async function matchMedicationWithDrugDatabase(
  medication: ScanMedicationItem,
): Promise<ScanMedicationItem> {
  if (isPlaceholderMedication(medication) || medication.drugCode) {
    return medication;
  }
  try {
    const page = await searchDrugs({ keyword: medication.drugName, size: DRUG_MATCH_SEARCH_SIZE });
    const match = findConfidentDrugMatch(page.content, medication.drugName);
    if (!match) {
      return medication;
    }
    return {
      atcCode: match.atcCode,
      drugName: match.drugName,
      drugCode: match.drugCode,
      dailyDoseCount: medication.dailyDoseCount,
    };
  } catch {
    return medication;
  }
}

async function matchDraftMedicationsWithDrugDatabase(
  draft: ScanPrescriptionDraft,
): Promise<ScanPrescriptionDraft> {
  const medications = await Promise.all(
    draft.medications.map((medication) => matchMedicationWithDrugDatabase(medication)),
  );
  return { ...draft, medications };
}

function toCreatePrescriptionBody(draft: ScanPrescriptionDraft): CreatePrescriptionRequest {
  return {
    title: draft.title,
    startDate: draft.startDate,
    endDate: draft.endDate,
    isDoctorApproved: true,
    medications: draft.medications.map((medication) => ({
      drugCode: "",
      atcCode: medication.atcCode,
      drugName: medication.drugName,
    })),
  };
}

export function usePrescriptionScanViewModel(): PrescriptionScanViewModel {
  const [draft, setDraft] = useState<ScanPrescriptionDraft | null>(null);
  const [draftJson, setDraftJson] = useState<string>(DEFAULT_MANUAL_JSON);
  const [error, setError] = useState<Error | null>(null);
  const [submitFeedback, setSubmitFeedback] = useState<PrescriptionSubmitFeedback | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isManualInputVisible, setIsManualInputVisible] = useState<boolean>(false);
  const setOcrResult = usePrescriptionOcrResultStore((state) => state.setResult);
  const createMutation = useCreatePrescriptionByScanMutation();

  const applyExtractedDraft = useCallback((nextDraft: ScanPrescriptionDraft, imageUri: string) => {
    setDraft(nextDraft);
    setDraftJson(JSON.stringify(nextDraft, null, JSON_PRETTY_SPACE));
    setSelectedImageUri(imageUri);
    setIsManualInputVisible(false);
    setError(null);
  }, []);

  const navigateToResultScreen = useCallback(
    (nextDraft: ScanPrescriptionDraft, imageUri: string) => {
      setOcrResult({ draft: nextDraft, imageUri });
      router.replace("/(detail)/scan/scan-result");
    },
    [setOcrResult],
  );

  const runExtractFromSource = useCallback(
    async (source: OcrImageSource) => {
      setIsExtracting(true);
      setError(null);
      try {
        const result = await extractDraftFromImageSource(source);
        if (!result) {
          return;
        }
        const matchedDraft = await matchDraftMedicationsWithDrugDatabase(result.draft);
        applyExtractedDraft(matchedDraft, result.imageUri);
        navigateToResultScreen(matchedDraft, result.imageUri);
      } catch (extractError) {
        setError(normalizeUnknownError(extractError));
      } finally {
        setIsExtracting(false);
      }
    },
    [applyExtractedDraft, navigateToResultScreen],
  );

  const extractFromGallery = useCallback(async () => {
    await runExtractFromSource("gallery");
  }, [runExtractFromSource]);

  const extractFromCamera = useCallback(async () => {
    await runExtractFromSource("camera");
  }, [runExtractFromSource]);

  const submitDraft = useCallback(async () => {
    if (!draft) {
      setError(new Error("등록할 스캔 결과가 없습니다. 먼저 스캔해 주세요."));
      return;
    }
    setError(null);
    setSubmitFeedback(null);
    try {
      const response = await createMutation.mutateAsync(toCreatePrescriptionBody(draft));
      const allergyWarnings = response.allergyWarnings ?? [];
      const hasAllergyConflict = response.hasAllergyConflict ?? false;
      const warningMessages = allergyWarnings.map((item) => item.warningMessage).join("\n");
      const message = hasAllergyConflict
        ? `${response.message}\n${warningMessages}`
        : response.message;
      setSubmitFeedback({
        kind: hasAllergyConflict ? "warning" : "success",
        message,
      });
    } catch (submitError) {
      const message = await getApiErrorMessage(
        submitError,
        "처방전 등록에 실패했습니다. 잠시 후 다시 시도해주세요.",
      );
      setError(new Error(message));
    }
  }, [createMutation, draft]);

  const retryExtract = useCallback(async () => {
    if (!selectedImageUri) {
      setError(new Error(NO_SELECTED_IMAGE_ERROR));
      return;
    }
    setIsExtracting(true);
    setError(null);
    try {
      const nextDraft = await extractDraftFromImageUri(selectedImageUri);
      const matchedDraft = await matchDraftMedicationsWithDrugDatabase(nextDraft);
      applyExtractedDraft(matchedDraft, selectedImageUri);
      navigateToResultScreen(matchedDraft, selectedImageUri);
    } catch (extractError) {
      setError(normalizeUnknownError(extractError));
    } finally {
      setIsExtracting(false);
    }
  }, [applyExtractedDraft, navigateToResultScreen, selectedImageUri]);

  const applyManualJson = useCallback(() => {
    try {
      const manualDraft = parsePrescriptionFromJson(draftJson);
      setDraft(manualDraft);
      setError(null);
      setIsManualInputVisible(false);
    } catch (jsonError) {
      const normalizedError =
        jsonError instanceof Error
          ? jsonError
          : new Error("직접 입력 JSON 형식이 올바르지 않습니다.");
      setError(normalizedError);
    }
  }, [draftJson]);

  const openManualInput = useCallback(() => {
    applyExtractedDraft(DEFAULT_MANUAL_DRAFT, MANUAL_INPUT_IMAGE_URI);
    navigateToResultScreen(DEFAULT_MANUAL_DRAFT, MANUAL_INPUT_IMAGE_URI);
  }, [applyExtractedDraft, navigateToResultScreen]);

  const closeManualInput = useCallback(() => {
    setIsManualInputVisible(false);
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const resetSubmitFeedback = useCallback(() => {
    setSubmitFeedback(null);
  }, []);

  return useMemo<PrescriptionScanViewModel>(
    () => ({
      draft,
      draftJson,
      isExtracting,
      isSubmitting: createMutation.isPending,
      isManualInputVisible,
      error,
      submitFeedback,
      selectedImageUri,
      extractFromGallery,
      extractFromCamera,
      submitDraft,
      retryExtract,
      openManualInput,
      closeManualInput,
      updateManualJson: setDraftJson,
      applyManualJson,
      resetError,
      resetSubmitFeedback,
    }),
    [
      applyManualJson,
      closeManualInput,
      createMutation.isPending,
      draft,
      draftJson,
      error,
      extractFromCamera,
      extractFromGallery,
      isExtracting,
      isManualInputVisible,
      openManualInput,
      resetError,
      resetSubmitFeedback,
      retryExtract,
      selectedImageUri,
      submitFeedback,
      submitDraft,
    ],
  );
}
