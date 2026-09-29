import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type {
  DeletePrescriptionResponse,
  PrescriptionListItem,
  PrescriptionMedicationItem,
  PrescriptionsListResponse,
  UpdatePrescriptionRequest,
  UpdatePrescriptionResponse,
} from "@/api/types/prescriptions";

interface PrescriptionsPageResponse {
  readonly content: readonly Omit<PrescriptionListItem, "medications">[];
  readonly isLast: boolean;
}

interface PrescriptionDetailMedicationResponse {
  readonly prescriptionDrugId: number;
  readonly drugCode: string;
  readonly atcCode: string;
  readonly drugName: string;
  readonly takeTimes: readonly string[];
  readonly mainIngredient?: string | null;
  readonly hasWarning?: boolean;
  readonly warningMessage?: string | null;
}

interface PrescriptionDetailResponse {
  readonly prescriptionId: number;
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly isDoctorApproved: boolean;
  readonly hasAllergyConflict: boolean;
  readonly medications: readonly PrescriptionDetailMedicationResponse[];
}

function normalizePrescriptionMedication(
  medication: PrescriptionDetailMedicationResponse,
): PrescriptionMedicationItem {
  return {
    medicationId: medication.prescriptionDrugId,
    prescriptionDrugId: medication.prescriptionDrugId,
    drugCode: medication.drugCode,
    atcCode: medication.atcCode,
    drugName: medication.drugName,
    takeTimes: medication.takeTimes,
    mainIngredient: medication.mainIngredient ?? medication.drugName,
    hasWarning: medication.hasWarning ?? false,
    warningMessage: medication.warningMessage ?? null,
  };
}

function normalizePrescriptionDetail(detail: PrescriptionDetailResponse): PrescriptionListItem {
  return {
    prescriptionId: detail.prescriptionId,
    title: detail.title,
    startDate: detail.startDate,
    endDate: detail.endDate,
    isDoctorApproved: detail.isDoctorApproved,
    hasAllergyConflict: detail.hasAllergyConflict,
    drugCount: detail.medications.length,
    medications: detail.medications.map(normalizePrescriptionMedication),
  };
}

function isPageResponse(value: unknown): value is PrescriptionsPageResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "content" in value &&
    Array.isArray((value as PrescriptionsPageResponse).content)
  );
}

export async function fetchPrescription(prescriptionId: number): Promise<PrescriptionListItem> {
  const detail = await api
    .get(apiPaths.prescription(prescriptionId))
    .json<PrescriptionDetailResponse>();

  return normalizePrescriptionDetail(detail);
}

export async function fetchPrescriptions(): Promise<PrescriptionsListResponse> {
  const response = await api
    .get(apiPaths.prescriptions)
    .json<PrescriptionsListResponse | PrescriptionsPageResponse>();

  if (!isPageResponse(response)) {
    return response;
  }

  const prescriptions = await Promise.all(
    response.content.map((item) => fetchPrescription(item.prescriptionId)),
  );

  return {
    prescriptions: prescriptions.map((detail) => {
      const summary = response.content.find(
        (item) => item.prescriptionId === detail.prescriptionId,
      );
      return { ...detail, ...summary, medications: detail.medications };
    }),
    isLast: response.isLast,
  };
}

export async function updatePrescription(
  prescriptionId: number,
  body: UpdatePrescriptionRequest,
): Promise<UpdatePrescriptionResponse> {
  return api
    .patch(apiPaths.prescription(prescriptionId), { json: body })
    .json<UpdatePrescriptionResponse>();
}

export async function deletePrescription(
  prescriptionId: number,
): Promise<DeletePrescriptionResponse> {
  return api.delete(apiPaths.prescription(prescriptionId)).json<DeletePrescriptionResponse>();
}
