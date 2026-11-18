import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type { CreatePrescriptionRequest, CreatePrescriptionResponse } from "@/api/types";
import type { ExtractPrescriptionResponse } from "@/api/types/prescription-scan";

export async function createPrescriptionByScan(
  body: CreatePrescriptionRequest,
): Promise<CreatePrescriptionResponse> {
  return api.post(apiPaths.prescriptions, { json: body }).json<CreatePrescriptionResponse>();
}

/** JPEG 정규화는 촬영 계층에서 수행한다. RN FormData는 로컬 파일 URI를 지원한다. */
export async function extractPrescription(
  imageUri: string,
  sessionVersion: number,
): Promise<ExtractPrescriptionResponse> {
  const body = new FormData();
  // React Native는 Blob 대신 { uri, name, type } 파일 항목을 받는다.
  const image = { uri: imageUri, name: "prescription.jpg", type: "image/jpeg" };
  body.append("image", image as unknown as Blob);
  return api
    .post(apiPaths.prescriptionsExtract, {
      body,
      context: { requiredSessionVersion: sessionVersion },
      timeout: 60_000,
      retry: { limit: 1, methods: [], statusCodes: [] },
    })
    .json<ExtractPrescriptionResponse>();
}
