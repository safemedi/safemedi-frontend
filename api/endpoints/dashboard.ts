import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type {
  TodayMedicationSchedulesResponse,
  UpdateMedicationRecordRequest,
  UpdateMedicationRecordResponse,
} from "@/api/types/dashboard";

export async function fetchTodayMedicationSchedules(): Promise<TodayMedicationSchedulesResponse> {
  return api.get(apiPaths.medicationRecordsToday).json<TodayMedicationSchedulesResponse>();
}

export async function updateMedicationRecords(
  body: UpdateMedicationRecordRequest,
): Promise<UpdateMedicationRecordResponse> {
  return api
    .patch(apiPaths.medicationRecords, { json: body })
    .json<UpdateMedicationRecordResponse>();
}
