import { useMemo } from "react";
import { usePrescriptionQuery } from "@/api/queries/prescriptions";
import type { PrescriptionMedicationItem } from "@/api/types/prescriptions";
import type {
  MedicationHistoryMedicationItem,
  MedicationHistoryViewModel,
  MedicationHistoryWarningItem,
} from "./types";

const EMPTY_DATE_LABEL = "-";
const DATE_FORMAT_OPTIONS = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
} as const;

function normalizePrescriptionIdParam(rawPrescriptionId: string | undefined): number | null {
  if (!rawPrescriptionId) return null;
  const parsed = Number(rawPrescriptionId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function formatDateLabel(dateText: string): string {
  const parsedDate = new Date(dateText);
  if (Number.isNaN(parsedDate.getTime())) return EMPTY_DATE_LABEL;
  return parsedDate.toLocaleDateString("ko-KR", DATE_FORMAT_OPTIONS).replace(/\.$/, "");
}

function extractActiveIngredients(medicationNames: readonly string[]): readonly string[] {
  return [...new Set(medicationNames)];
}

function createDefaultWarningItems(
  medication: PrescriptionMedicationItem,
): readonly MedicationHistoryWarningItem[] {
  if (medication.warningMessage) {
    return [{ id: `${medication.medicationId}-warning`, message: medication.warningMessage }];
  }
  if (!medication.hasWarning) return [];
  return [
    {
      id: `${medication.medicationId}-status-warning`,
      message: "주의가 필요한 약물입니다. 복용 전 의사 상담이 필요할 수 있습니다.",
    },
  ];
}

function createMedicationItem(
  medication: PrescriptionMedicationItem,
): MedicationHistoryMedicationItem {
  const scheduledTimesLabel =
    medication.takeTimes.length > 0
      ? `${medication.takeTimes.join(", ")} 복용`
      : "복용 시간 미설정";
  const tone = medication.hasWarning ? "warning" : "safe";

  return {
    id: String(medication.medicationId),
    medicationName: medication.drugName,
    scheduledTimesLabel,
    activeIngredients: extractActiveIngredients([medication.mainIngredient]),
    tone,
    warningItems: createDefaultWarningItems(medication),
  };
}

export function useMedicationHistoryViewModel(
  prescriptionIdParam: string | undefined,
): MedicationHistoryViewModel {
  const prescriptionId = normalizePrescriptionIdParam(prescriptionIdParam);
  const query = usePrescriptionQuery(prescriptionId);

  const medications = useMemo<readonly MedicationHistoryMedicationItem[]>(() => {
    if (!query.data) return [];
    return query.data.medications.map((medication) => createMedicationItem(medication));
  }, [query.data]);

  const warningCount = useMemo<number>(() => {
    return medications.filter((medication) => medication.tone === "warning").length;
  }, [medications]);

  const warningSummary =
    warningCount > 0 ? "일부 약물에 경고 사항이 있습니다. 의사와 상담 후 복용하세요." : null;
  const displayDate = query.data?.createdAt
    ? formatDateLabel(query.data.createdAt)
    : query.data?.startDate
      ? formatDateLabel(query.data.startDate)
      : "";

  return {
    displayDate: displayDate || EMPTY_DATE_LABEL,
    warningSummary,
    medications,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
