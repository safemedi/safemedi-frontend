import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type {
  TodayMedicationSchedulesResponse,
  UpdateMedicationRecordRequest,
  UpdateMedicationRecordResponse,
} from "@/api/types/dashboard";

export async function fetchTodayMedicationSchedules(
  familyId?: number,
): Promise<TodayMedicationSchedulesResponse> {
  if (familyId !== undefined) {
    return api
      .get(apiPaths.medicationRecordsToday, {
        searchParams: { familyId: String(familyId) },
      })
      .json<TodayMedicationSchedulesResponse>();
  }
  return api.get(apiPaths.medicationRecordsToday).json<TodayMedicationSchedulesResponse>();
}

export async function updateMedicationRecords(
  body: UpdateMedicationRecordRequest,
): Promise<UpdateMedicationRecordResponse> {
  return api
    .patch(apiPaths.medicationRecords, { json: body })
    .json<UpdateMedicationRecordResponse>();
}
