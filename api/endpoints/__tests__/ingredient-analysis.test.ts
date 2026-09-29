import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type { AnalyzeIngredientsRequest } from "@/api/types";
import { analyzePrescriptionIngredients } from "../ingredient-analysis";

const mockApiPost = jest.fn();

const BASE_REQUEST: AnalyzeIngredientsRequest = {
  title: "스캔 처방전",
  startDate: "2026-05-01",
  endDate: "2026-05-07",
  takeTimes: ["08:00"],
  medications: [{ drugCode: "D01", atcCode: "A01", drugName: "타이레놀", takeTimes: ["08:00"] }],
};

jest.mock("@/api/client", () => ({
  api: {
    post: (...args: unknown[]) => mockApiPost(...args),
  },
}));

jest.mock("@/constants/api-config", () => ({
  apiConfig: { useMock: false },
}));

type MockApiConfig = {
  useMock: boolean;
};

function setMockMode(useMock: boolean) {
  const { apiConfig } = require("@/constants/api-config") as { apiConfig: MockApiConfig };
  apiConfig.useMock = useMock;
}

describe("api/endpoints/ingredient-analysis", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setMockMode(false);
  });

  it("API 성공 시 명세 응답을 화면 모델로 정규화한다", async () => {
    const apiResponse = {
      safetySummary: { safeCount: 1, warningCount: 0, dangerCount: 0 },
      analyzedMedications: [
        {
          atcCode: "A01",
          drugName: "타이레놀",
          status: "SAFE",
          efficacy: "해열, 진통 효과",
          precautions: ["공복 복용 시 위장 장애 가능"],
          warnings: [],
        },
      ],
    };
    const mockJson = jest.fn(async () => apiResponse);
    mockApiPost.mockReturnValue({ json: mockJson });

    const result = await analyzePrescriptionIngredients(BASE_REQUEST);

    expect(api.post).toBeDefined();
    expect(mockApiPost).toHaveBeenCalledWith(apiPaths.prescriptionsAnalysis, {
      json: { medications: [{ drugCode: "D01" }] },
    });
    expect(result).toEqual({
      title: "스캔 처방전",
      analyzedMedicationCount: 1,
      summary: { safeCount: 1, cautionCount: 0, dangerCount: 0 },
      medications: [
        {
          atcCode: "A01",
          drugName: "타이레놀",
          riskLevel: "SAFE",
          status: "SAFE",
          efficacy: ["해열, 진통 효과"],
          precautions: ["공복 복용 시 위장 장애 가능"],
          warnings: [],
        },
      ],
      shouldConsultDoctor: false,
      doctorConsultationMessage: null,
    });
  });

  it("mock 모드에서 API 실패 시 mock 응답을 생성한다", async () => {
    setMockMode(true);
    mockApiPost.mockImplementation(() => {
      throw new Error("network");
    });

    const result = await analyzePrescriptionIngredients(BASE_REQUEST);

    expect(result.title).toBe("스캔 처방전");
    expect(result.analyzedMedicationCount).toBe(1);
    expect(
      result.summary.safeCount + result.summary.cautionCount + result.summary.dangerCount,
    ).toBe(1);
    expect(result.medications[0]?.drugName).toBe("타이레놀");
  });

  it("mock 응답은 takeTimes가 없어도 분석 결과를 생성한다", async () => {
    setMockMode(true);
    mockApiPost.mockImplementation(() => {
      throw new Error("network");
    });
    const requestWithoutTakeTimes: AnalyzeIngredientsRequest = {
      ...BASE_REQUEST,
      medications: [{ drugCode: "D01", atcCode: "A01", drugName: "타이레놀" }],
    };

    const result = await analyzePrescriptionIngredients(requestWithoutTakeTimes);

    expect(result.analyzedMedicationCount).toBe(1);
    expect(result.medications[0]?.atcCode).toBe("A01");
  });

  it("mock 분석은 SAFE/CAUTION/DANGER 모든 위험도를 반환할 수 있다", async () => {
    setMockMode(true);
    mockApiPost.mockImplementation(() => {
      throw new Error("network");
    });
    const observedRiskLevels = new Set<string>();

    for (let index = 0; index < 300; index += 1) {
      const dynamicRequest: AnalyzeIngredientsRequest = {
        ...BASE_REQUEST,
        medications: [
          {
            atcCode: "A01",
            drugCode: `D-${index}`,
            drugName: `drug-${index}`,
            takeTimes: index % 2 === 0 ? ["08:00"] : undefined,
          },
        ],
      };
      const result = await analyzePrescriptionIngredients(dynamicRequest);
      const riskLevel = result.medications[0]?.riskLevel;

      if (riskLevel) {
        observedRiskLevels.add(riskLevel);
      }
      if (observedRiskLevels.size === 3) {
        break;
      }
    }

    expect(observedRiskLevels).toEqual(new Set(["SAFE", "CAUTION", "DANGER"]));
  });

  it("mock 모드가 아니면 API 실패를 그대로 throw 한다", async () => {
    const expectedError = new Error("network down");
    mockApiPost.mockImplementation(() => {
      throw expectedError;
    });

    await expect(analyzePrescriptionIngredients(BASE_REQUEST)).rejects.toThrow("network down");
  });
});
