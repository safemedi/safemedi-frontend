import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type {
  AnalysisRiskLevel,
  AnalysisWarningType,
  AnalyzeIngredientMedication,
  AnalyzeIngredientsRequest,
  AnalyzeIngredientsResponse,
} from "@/api/types";
import { apiConfig } from "@/constants/api-config";

interface RiskPreset {
  readonly riskLevel: AnalysisRiskLevel;
  readonly efficacy: readonly string[];
  readonly precautions: readonly string[];
  readonly warningType: AnalysisWarningType | null;
  readonly warningTitle: string | null;
  readonly warningMessage: string | null;
}

interface MockAnalysisContext {
  readonly riskLevel: AnalysisRiskLevel;
  readonly warningType: AnalysisWarningType | null;
}

interface AnalyzeIngredientsApiMedication {
  readonly atcCode: string;
  readonly drugName: string;
  readonly status: AnalysisRiskLevel;
  readonly efficacy: string | readonly string[];
  readonly precautions: readonly string[];
  readonly warnings: readonly {
    readonly type: AnalysisWarningType;
    readonly title?: string;
    readonly message: string;
  }[];
}

interface AnalyzeIngredientsApiResponse {
  readonly safetySummary: {
    readonly safeCount: number;
    readonly warningCount: number;
    readonly cautionCount?: number;
    readonly dangerCount: number;
  };
  readonly analyzedMedications: readonly AnalyzeIngredientsApiMedication[];
}

function createStableScore(value: string): number {
  return [...value].reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function resolveMockRiskLevel(
  item: AnalyzeIngredientsRequest["medications"][number],
): AnalysisRiskLevel {
  const scoreSource = [
    item.drugCode,
    item.atcCode,
    item.drugName,
    (item.takeTimes ?? []).join(","),
  ].join("|");
  const score = createStableScore(scoreSource) % 100;

  if (score >= 70) {
    return "DANGER";
  }
  if (score >= 35) {
    return "CAUTION";
  }
  return "SAFE";
}

function resolveWarningType(scoreSource: string): AnalysisWarningType {
  return createStableScore(scoreSource) % 2 === 0 ? "INTERACTION" : "ALLERGY";
}

function createRiskPreset(
  item: AnalyzeIngredientsRequest["medications"][number],
  context: MockAnalysisContext,
): RiskPreset {
  if (context.riskLevel === "SAFE") {
    return {
      riskLevel: "SAFE",
      efficacy: [`${item.drugName}의 일반적인 치료 반응이 기대됩니다.`],
      precautions: ["권장 복용 시간과 용량을 지켜주세요."],
      warningType: null,
      warningTitle: null,
      warningMessage: null,
    };
  }

  if (context.riskLevel === "CAUTION") {
    return {
      riskLevel: "CAUTION",
      efficacy: [`${item.drugName} 복용 후 증상 변화를 확인해 주세요.`],
      precautions: ["장기 복용 시 의사 또는 약사 상담을 권장합니다."],
      warningType: context.warningType,
      warningTitle: "복용 주의",
      warningMessage: `${item.drugName} 복용 시 개인 상태에 따라 추가 확인이 필요합니다.`,
    };
  }

  return {
    riskLevel: "DANGER",
    efficacy: [`${item.drugName}은 치료 이점 대비 위험 평가가 우선입니다.`],
    precautions: ["복용 전 반드시 의사 또는 약사와 상담하세요."],
    warningType: context.warningType,
    warningTitle: "전문가 상담 필요",
    warningMessage: `${item.drugName} 복용 전 알러지 및 병용 위험을 반드시 확인해 주세요.`,
  };
}

function createMockMedication(
  item: AnalyzeIngredientsRequest["medications"][number],
): AnalyzeIngredientMedication {
  const scoreSource = `${item.atcCode}|${item.drugName}`;
  const riskLevel = resolveMockRiskLevel(item);
  const warningType = riskLevel === "SAFE" ? null : resolveWarningType(scoreSource);
  const preset = createRiskPreset(item, { riskLevel, warningType });

  return {
    atcCode: item.atcCode,
    drugName: item.drugName,
    riskLevel: preset.riskLevel,
    efficacy: preset.efficacy,
    precautions: preset.precautions,
    warnings:
      preset.warningType && preset.warningTitle && preset.warningMessage
        ? [
            {
              type: preset.warningType,
              title: preset.warningTitle,
              message: preset.warningMessage,
            },
          ]
        : [],
  };
}

function normalizeTextList(value: string | readonly string[]): readonly string[] {
  return Array.isArray(value) ? value : [value];
}

function normalizeAnalyzeResponse(
  body: AnalyzeIngredientsRequest,
  response: AnalyzeIngredientsApiResponse,
): AnalyzeIngredientsResponse {
  const medications = response.analyzedMedications.map((item) => ({
    atcCode: item.atcCode,
    drugName: item.drugName,
    riskLevel: item.status,
    status: item.status,
    efficacy: normalizeTextList(item.efficacy),
    precautions: item.precautions,
    warnings: item.warnings,
  }));
  const cautionCount = response.safetySummary.cautionCount ?? response.safetySummary.warningCount;
  const shouldConsultDoctor = response.safetySummary.dangerCount > 0 || cautionCount > 0;

  return {
    title: body.title,
    analyzedMedicationCount: medications.length,
    summary: {
      safeCount: response.safetySummary.safeCount,
      cautionCount,
      dangerCount: response.safetySummary.dangerCount,
    },
    medications,
    shouldConsultDoctor,
    doctorConsultationMessage: shouldConsultDoctor
      ? "주의가 필요한 약물이 있습니다. 복용 전 의사 또는 약사 상담 여부를 확인해 주세요."
      : null,
  };
}

function createMockResponse(body: AnalyzeIngredientsRequest): AnalyzeIngredientsResponse {
  const medications = body.medications.map(createMockMedication);
  const safeCount = medications.filter((item) => item.riskLevel === "SAFE").length;
  const cautionCount = medications.filter((item) => item.riskLevel === "CAUTION").length;
  const dangerCount = medications.filter((item) => item.riskLevel === "DANGER").length;
  const shouldConsultDoctor = dangerCount > 0;

  return {
    title: body.title,
    analyzedMedicationCount: medications.length,
    summary: {
      safeCount,
      cautionCount,
      dangerCount,
    },
    medications,
    shouldConsultDoctor,
    doctorConsultationMessage: shouldConsultDoctor
      ? "위험 요소가 발견되었습니다. 복용 전 반드시 의사 또는 약사와 상담해 주세요."
      : null,
  };
}

export async function analyzePrescriptionIngredients(
  body: AnalyzeIngredientsRequest,
): Promise<AnalyzeIngredientsResponse> {
  try {
    const response = await api
      .post(apiPaths.prescriptionsAnalysis, {
        json: {
          medications: body.medications.map((item) => ({ drugCode: item.drugCode })),
        },
      })
      .json<AnalyzeIngredientsApiResponse>();
    return normalizeAnalyzeResponse(body, response);
  } catch (error) {
    if (apiConfig.useMock) {
      return createMockResponse(body);
    }
    throw error;
  }
}
