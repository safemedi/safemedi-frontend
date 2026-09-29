import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Alert } from "react-native";
import type {
  AnalyzeIngredientsRequest,
  CreatePrescriptionMedication,
  DrugSearchItem,
} from "@/api/types";
import { hasOnlyPlaceholderMedications } from "@/features/scan/prescription-scan/ocr-parser";
import { formatDateLabel, formatDateToIso, parseIsoDate } from "@/utils/date";
import { getPrescriptionTitleError } from "@/utils/prescription";
import { useIngredientAnalysisStore } from "../ingredient-analysis/useIngredientAnalysisStore";
import { usePrescriptionOcrResultStore } from "../prescription-scan/usePrescriptionOcrResultStore";

export type MedicationTakeSlot = "MORNING" | "LUNCH" | "DINNER";

interface MedicationTakeSlotOption {
  readonly slot: MedicationTakeSlot;
  readonly label: string;
  readonly timeRange: string;
  readonly defaultTime: string;
}

export const MEDICATION_TAKE_SLOT_OPTIONS: readonly MedicationTakeSlotOption[] = [
  { slot: "MORNING", label: "🌅 아침", timeRange: "07:00~09:00", defaultTime: "08:00" },
  { slot: "LUNCH", label: "☀ 점심", timeRange: "12:00~14:00", defaultTime: "13:00" },
  { slot: "DINNER", label: "🌙 저녁", timeRange: "18:00~20:00", defaultTime: "19:00" },
] as const;

export interface EditableMedicationItem {
  readonly drugName: string;
  readonly drugCode: string;
  readonly atcCode: string;
  readonly takeSlots: MedicationTakeSlot[];
}

export interface PrescriptionScanResultFormValues {
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly medications: EditableMedicationItem[];
}

const EMPTY_MEDICATION_ATC_CODE = "";
const EMPTY_MEDICATION_DRUG_CODE = "";
const MANUAL_INPUT_IMAGE_URI_PREFIX = "manual://";
const EMPTY_RESULT_ERROR = "복약 등록 정보가 없습니다. 스캔 화면으로 이동합니다.";
const DRUG_NAME_NOT_SELECTED_ERROR = "약물명은 검색 결과에서 선택해야 합니다.";
const INVALID_DATE_RANGE_ERROR = "복약 종료일은 시작일보다 빠를 수 없습니다.";

type PrescriptionDateField = "startDate" | "endDate";

function convertTakeSlotsToTimes(takeSlots: readonly MedicationTakeSlot[]): string[] {
  const selected = new Set(takeSlots);
  return MEDICATION_TAKE_SLOT_OPTIONS.filter((option) => selected.has(option.slot)).map(
    (option) => option.defaultTime,
  );
}

const DAILY_DOSE_COUNT_TAKE_SLOTS: Readonly<Record<number, readonly MedicationTakeSlot[]>> = {
  1: ["MORNING"],
  2: ["MORNING", "DINNER"],
  3: ["MORNING", "LUNCH", "DINNER"],
};

function takeSlotsForDailyDoseCount(dailyDoseCount: number | undefined): MedicationTakeSlot[] {
  if (!dailyDoseCount) return [];
  return [...(DAILY_DOSE_COUNT_TAKE_SLOTS[dailyDoseCount] ?? [])];
}

function createRequestMedications(
  medications: readonly EditableMedicationItem[],
): CreatePrescriptionMedication[] {
  return medications.map((item) => ({
    drugCode: item.drugCode.trim(),
    atcCode: item.atcCode.trim(),
    drugName: item.drugName.trim(),
    takeTimes: convertTakeSlotsToTimes(item.takeSlots),
  }));
}

function createRequestTakeTimes(medications: readonly CreatePrescriptionMedication[]): string[] {
  const uniqueTakeTimes = new Set<string>();
  medications.forEach((item) => {
    (item.takeTimes ?? []).forEach((takeTime) => {
      uniqueTakeTimes.add(takeTime);
    });
  });
  return MEDICATION_TAKE_SLOT_OPTIONS.map((option) => option.defaultTime).filter((time) =>
    uniqueTakeTimes.has(time),
  );
}

export function usePrescriptionScanResultViewModel() {
  const result = usePrescriptionOcrResultStore((state) => state.result);
  const clearResult = usePrescriptionOcrResultStore((state) => state.clearResult);
  const setIngredientAnalysisRequest = useIngredientAnalysisStore((state) => state.setRequest);
  const shouldSuppressEmptyResultAlertRef = useRef<boolean>(false);
  const [editingMedicationIndex, setEditingMedicationIndex] = useState<number | null>(null);

  const initialValues = useMemo<PrescriptionScanResultFormValues | null>(() => {
    if (!result) return null;
    return {
      title: result.draft.title,
      startDate: result.draft.isDateRangeConfident ? result.draft.startDate : "",
      endDate: result.draft.isDateRangeConfident ? result.draft.endDate : "",
      medications: result.draft.medications.map((item) => ({
        drugName: item.drugName,
        drugCode: item.drugCode ?? "",
        atcCode: item.atcCode,
        takeSlots: takeSlotsForDailyDoseCount(item.dailyDoseCount),
      })),
    };
  }, [result]);

  const form = useForm<PrescriptionScanResultFormValues>({
    defaultValues: initialValues ?? { title: "", startDate: "", endDate: "", medications: [] },
  });
  const { control, getValues, reset, setValue } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "medications",
  });

  useEffect(() => {
    if (!initialValues) return;
    reset(initialValues);
  }, [initialValues, reset]);

  useEffect(() => {
    if (result) return;
    if (shouldSuppressEmptyResultAlertRef.current) return;
    Alert.alert("스캔 결과 없음", EMPTY_RESULT_ERROR, [
      {
        text: "확인",
        onPress: () => router.replace("/(detail)/scan/scan"),
      },
    ]);
  }, [result]);

  const handlePressClose = useCallback(() => {
    router.replace("/(tabs)/dashboard");
  }, []);

  const handlePressRetryScan = useCallback(() => {
    shouldSuppressEmptyResultAlertRef.current = true;
    clearResult();
    router.replace("/(detail)/scan/scan");
  }, [clearResult]);

  const handlePressAddMedication = useCallback(() => {
    append({
      drugName: "",
      drugCode: EMPTY_MEDICATION_DRUG_CODE,
      atcCode: EMPTY_MEDICATION_ATC_CODE,
      takeSlots: [],
    });
    setEditingMedicationIndex(fields.length);
  }, [append, fields.length]);

  const handlePressRemoveMedication = useCallback(
    (index: number) => {
      remove(index);
      setEditingMedicationIndex((prev) => {
        if (prev === null) return null;
        if (prev === index) return null;
        return prev > index ? prev - 1 : prev;
      });
    },
    [remove],
  );

  const handlePressEditMedication = useCallback((index: number) => {
    setEditingMedicationIndex(index);
  }, []);

  const handlePressCompleteMedicationEdit = useCallback(() => {
    setEditingMedicationIndex(null);
  }, []);

  const handleChangeMedicationName = useCallback(
    (index: number, drugName: string) => {
      setValue(`medications.${index}.drugName`, drugName, {
        shouldDirty: true,
        shouldTouch: true,
      });
      setValue(`medications.${index}.drugCode`, EMPTY_MEDICATION_DRUG_CODE, {
        shouldDirty: true,
        shouldTouch: true,
      });
      setValue(`medications.${index}.atcCode`, EMPTY_MEDICATION_ATC_CODE, {
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [setValue],
  );

  const handleSelectMedicationDrug = useCallback(
    (index: number, item: DrugSearchItem) => {
      setValue(`medications.${index}.drugName`, item.drugName, {
        shouldDirty: true,
        shouldTouch: true,
      });
      setValue(`medications.${index}.drugCode`, item.drugCode, {
        shouldDirty: true,
        shouldTouch: true,
      });
      setValue(`medications.${index}.atcCode`, item.atcCode, {
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [setValue],
  );

  const handleToggleMedicationTakeSlot = useCallback(
    (index: number, slot: MedicationTakeSlot) => {
      const fieldName = `medications.${index}.takeSlots` as const;
      const currentSlots = getValues(fieldName);
      const nextSlots = currentSlots.includes(slot)
        ? currentSlots.filter((item) => item !== slot)
        : [...currentSlots, slot];
      setValue(fieldName, nextSlots, { shouldDirty: true, shouldTouch: true });
    },
    [getValues, setValue],
  );

  const handleSelectPrescriptionDate = useCallback(
    (field: PrescriptionDateField, date: Date) => {
      setValue(field, formatDateToIso(date), { shouldDirty: true, shouldTouch: true });
    },
    [setValue],
  );

  const handlePressAnalyze = useCallback(async () => {
    if (!result) {
      Alert.alert("스캔 결과 없음", EMPTY_RESULT_ERROR, [
        {
          text: "확인",
          onPress: () => router.replace("/(detail)/scan/scan"),
        },
      ]);
      return;
    }

    const values = getValues();
    const title = values.title.trim();
    const startDate = values.startDate.trim();
    const endDate = values.endDate.trim();
    const medications = createRequestMedications(values.medications);
    const takeTimes = createRequestTakeTimes(medications);
    const parsedStartDate = parseIsoDate(startDate);
    const parsedEndDate = parseIsoDate(endDate);

    const titleError = getPrescriptionTitleError(title);
    if (titleError) {
      Alert.alert("입력 확인", titleError);
      return;
    }
    if (!parsedStartDate || !parsedEndDate) {
      Alert.alert("입력 확인", "복약 시작일과 종료일을 모두 선택해주세요.");
      return;
    }
    if (parsedStartDate.getTime() > parsedEndDate.getTime()) {
      Alert.alert("입력 확인", INVALID_DATE_RANGE_ERROR);
      return;
    }
    if (!medications.length) {
      Alert.alert("입력 확인", "최소 1개의 약물을 등록해주세요.");
      return;
    }
    if (medications.some((item) => item.drugName.length === 0)) {
      Alert.alert("입력 확인", "약물명을 모두 입력해주세요.");
      return;
    }
    if (medications.some((item) => item.atcCode.length === 0)) {
      Alert.alert("입력 확인", DRUG_NAME_NOT_SELECTED_ERROR);
      return;
    }
    if (medications.some((item) => item.drugCode.length === 0)) {
      Alert.alert("입력 확인", DRUG_NAME_NOT_SELECTED_ERROR);
      return;
    }
    if (medications.some((item) => (item.takeTimes?.length ?? 0) === 0)) {
      Alert.alert("입력 확인", "각 약물마다 복약 시간을 최소 1개 선택해주세요.");
      return;
    }
    if (!takeTimes.length) {
      Alert.alert("입력 확인", "복약 시간을 최소 1개 이상 선택해주세요.");
      return;
    }

    const payload: AnalyzeIngredientsRequest = {
      title,
      startDate,
      endDate,
      takeTimes,
      medications,
    };
    setIngredientAnalysisRequest(payload);
    router.replace("/(detail)/scan/ingredient-analysis");
  }, [getValues, result, setIngredientAnalysisRequest]);

  const recognizedMedicationCount = result?.draft.medications.length ?? 0;
  const isManualInputMode = result?.imageUri.startsWith(MANUAL_INPUT_IMAGE_URI_PREFIX) ?? false;
  const hasLowConfidenceExtraction = result
    ? hasOnlyPlaceholderMedications(result.draft.medications)
    : false;
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  const startDateLabel = useMemo(() => formatDateLabel(startDate), [startDate]);
  const endDateLabel = useMemo(() => formatDateLabel(endDate), [endDate]);

  const startDateValue = useMemo(() => parseIsoDate(startDate) ?? new Date(), [startDate]);
  const endDateValue = useMemo(() => parseIsoDate(endDate) ?? new Date(), [endDate]);
  const isDateRangeReady = useMemo(() => {
    const parsedStartDate = parseIsoDate(startDate);
    const parsedEndDate = parseIsoDate(endDate);
    if (!parsedStartDate || !parsedEndDate) return false;
    return parsedStartDate.getTime() <= parsedEndDate.getTime();
  }, [startDate, endDate]);

  const isAnalyzeDisabled = !isDateRangeReady;

  return {
    control,
    fields,
    editingMedicationIndex,
    isSubmitting: false,
    recognizedMedicationCount,
    isManualInputMode,
    hasLowConfidenceExtraction,
    startDate,
    endDate,
    startDateLabel,
    endDateLabel,
    startDateValue,
    endDateValue,
    isAnalyzeDisabled,
    handlePressClose,
    handlePressRetryScan,
    handlePressAddMedication,
    handlePressAnalyze,
    handlePressEditMedication,
    handlePressCompleteMedicationEdit,
    handleChangeMedicationName,
    handleSelectMedicationDrug,
    handleToggleMedicationTakeSlot,
    handleSelectPrescriptionDate,
    handlePressRemoveMedication,
  };
}
