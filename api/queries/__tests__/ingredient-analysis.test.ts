import { renderHook } from "@testing-library/react-native";
import { queryKeys } from "@/api/query-keys";
import type { AnalyzeIngredientsRequest } from "@/api/types";
import { useAnalyzeIngredientsMutation } from "../ingredient-analysis";

const mockAnalyzePrescriptionIngredients = jest.fn<
  Promise<unknown>,
  [AnalyzeIngredientsRequest, number]
>(async () => ({}));

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn((options: unknown) => options),
}));

jest.mock("@/api/endpoints/ingredient-analysis", () => ({
  analyzePrescriptionIngredients: (body: AnalyzeIngredientsRequest, sessionVersion: number) =>
    mockAnalyzePrescriptionIngredients(body, sessionVersion),
}));

describe("api/queries/ingredient-analysis", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("분석 mutation key와 mutationFn을 구성한다", async () => {
    const { result } = renderHook(() => useAnalyzeIngredientsMutation());
    const mutation = result.current as unknown as {
      mutationKey: unknown;
      mutationFn: (input: {
        body: AnalyzeIngredientsRequest;
        sessionVersion: number;
      }) => Promise<unknown>;
    };

    const request: AnalyzeIngredientsRequest = {
      title: "스캔 처방전",
      startDate: "2026-05-01",
      endDate: "2026-05-07",
      takeTimes: ["08:00"],
      medications: [
        { drugCode: "D01", atcCode: "A01", drugName: "타이레놀", takeTimes: ["08:00"] },
      ],
    };

    expect(mutation.mutationKey).toEqual(queryKeys.scan.analyzeIngredients);
    await mutation.mutationFn({ body: request, sessionVersion: 3 });
    expect(mockAnalyzePrescriptionIngredients).toHaveBeenCalledWith(request, 3);
  });
});
