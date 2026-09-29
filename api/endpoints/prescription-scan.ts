import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type { CreatePrescriptionRequest, CreatePrescriptionResponse } from "@/api/types";

export async function createPrescriptionByScan(
  body: CreatePrescriptionRequest,
): Promise<CreatePrescriptionResponse> {
  return api.post(apiPaths.prescriptions, { json: body }).json<CreatePrescriptionResponse>();
}
