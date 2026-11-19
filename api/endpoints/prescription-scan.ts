import { Platform } from "react-native";
import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type { CreatePrescriptionRequest, CreatePrescriptionResponse } from "@/api/types";
import type { ExtractPrescriptionResponse } from "@/api/types/prescription-scan";

export async function createPrescriptionByScan(
  body: CreatePrescriptionRequest,
  sessionVersion: number,
): Promise<CreatePrescriptionResponse> {
  return api
    .post(apiPaths.prescriptions, {
      json: body,
      context: { requiredSessionVersion: sessionVersion },
    })
    .json<CreatePrescriptionResponse>();
}

/** JPEG 정규화는 촬영 계층에서 수행한다. RN FormData는 로컬 파일 URI를 지원한다. */
export async function extractPrescription(
  imageUri: string,
  sessionVersion: number,
): Promise<ExtractPrescriptionResponse> {
  const body = new FormData();
  const fileName = "prescription.jpg";
  if (Platform.OS === "web") {
    const fileResponse = await fetch(imageUri);
    if (!fileResponse.ok) throw new Error("선택한 사진을 불러오지 못했습니다.");
    body.append("image", await fileResponse.blob(), fileName);
  } else {
    // React Native의 multipart 전송기는 로컬 파일 URI를 받는다.
    const image = { uri: imageUri, name: fileName, type: "image/jpeg" };
    body.append("image", image as unknown as Blob);
  }
  return api
    .post(apiPaths.prescriptionsExtract, {
      body,
      context: { requiredSessionVersion: sessionVersion },
      timeout: 60_000,
      retry: { limit: 1, methods: [], statusCodes: [] },
    })
    .json<ExtractPrescriptionResponse>();
}
