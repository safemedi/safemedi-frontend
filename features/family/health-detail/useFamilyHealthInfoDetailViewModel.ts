import { router, useLocalSearchParams } from "expo-router";
import { getHttpStatus } from "@/api/error";
import { useFamilyMedicalSummary } from "@/api/queries/family";
import type { MedicalSummaryPrescription } from "@/api/types/medical-summary";
import {
  ALLERGY_BADGE_LABEL,
  ALLERGY_ITEM_DESCRIPTION,
  CHRONIC_BADGE_LABEL,
  CHRONIC_ITEM_DESCRIPTION,
} from "@/features/profile/health-detail/constants";
import type { ClinicalAlertSection, PatientInfo } from "@/features/profile/health-detail/types";
import { useSessionStore } from "@/stores/sessionStore";

export interface FamilyHealthInfoDetailViewModel {
  readonly patient: PatientInfo | undefined;
  readonly allergySection: ClinicalAlertSection | undefined;
  readonly diseaseSection: ClinicalAlertSection | undefined;
  readonly prescriptions: readonly MedicalSummaryPrescription[];
  readonly isLoading: boolean;
  readonly isRefreshing: boolean;
  readonly errorMessage: string | undefined;
  readonly canRetry: boolean;
  readonly handleRefresh: () => void;
  readonly handleBack: () => void;
}

export function useFamilyHealthInfoDetailViewModel(): FamilyHealthInfoDetailViewModel {
  const { familyId: rawId } = useLocalSearchParams<{ familyId?: string | string[] }>();
  const familyId = typeof rawId === "string" && /^\d+$/.test(rawId) ? Number(rawId) : undefined;
  const hasValidFamilyId = familyId !== undefined && Number.isSafeInteger(familyId) && familyId > 0;
  const accessToken = useSessionStore((state) => state.accessToken);
  const query = useFamilyMedicalSummary(hasValidFamilyId ? familyId : undefined);
  const status = getHttpStatus(query.error);
  let errorMessage: string | undefined;
  if (!hasValidFamilyId) errorMessage = "가족 정보를 확인할 수 없습니다.";
  else if (!accessToken || status === 401) errorMessage = "다시 로그인해 주세요.";
  else if (status === 403) errorMessage = "해당 가족이 건강 정보 공개를 허용하지 않았습니다.";
  else if (status === 404) errorMessage = "존재하지 않거나 연동이 해제된 가족입니다.";
  else if (query.isError) errorMessage = "가족의 건강 정보를 불러오지 못했습니다.";

  const data = errorMessage ? undefined : query.data;
  const rhSign = data?.rhType === "PLUS" ? "+" : data?.rhType === "MINUS" ? "-" : undefined;
  return {
    patient: data
      ? {
          name: data.name ?? "-",
          birthDate: data.birthDate?.replaceAll("-", ".") ?? "-",
          gender: data.gender === "MALE" ? "남성" : data.gender === "FEMALE" ? "여성" : "-",
          height: data.height == null ? "-" : `${data.height} cm`,
          weight: data.weight == null ? "-" : `${data.weight} kg`,
          bloodType: data.bloodType ? `${data.bloodType}${rhSign ? ` (Rh${rhSign})` : ""}` : "-",
        }
      : undefined,
    allergySection: data?.allergies.length
      ? {
          title: "약물 알러지",
          subtitle: "처방 전 반드시 확인 필요",
          tone: "danger",
          items: data.allergies.map((allergy) => ({
            id: `${allergy.type}-${allergy.value}`,
            title: allergy.name,
            description: ALLERGY_ITEM_DESCRIPTION,
            badgeLabel: ALLERGY_BADGE_LABEL,
          })),
        }
      : undefined,
    diseaseSection: data?.diseases.length
      ? {
          title: "기저질환",
          subtitle: "약물 대사 고려 필요",
          tone: "info",
          items: data.diseases.map((disease) => ({
            id: disease.code,
            title: disease.name,
            description: CHRONIC_ITEM_DESCRIPTION,
            badgeLabel: CHRONIC_BADGE_LABEL,
          })),
        }
      : undefined,
    prescriptions: data?.activeMedications ?? [],
    isLoading: query.isLoading,
    isRefreshing: query.isRefetching,
    errorMessage,
    canRetry:
      hasValidFamilyId && !!accessToken && status !== 401 && status !== 403 && status !== 404,
    handleRefresh: () => {
      if (hasValidFamilyId && accessToken) void query.refetch();
    },
    handleBack: () => router.back(),
  };
}
