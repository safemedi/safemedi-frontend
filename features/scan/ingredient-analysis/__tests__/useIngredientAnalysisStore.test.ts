import type { AnalyzeIngredientsRequest } from "@/api/types";
import { useIngredientAnalysisStore } from "../useIngredientAnalysisStore";

const BASE_REQUEST: AnalyzeIngredientsRequest = {
  title: "스캔 처방전",
  startDate: "2026-05-01",
  endDate: "2026-05-07",
  takeTimes: ["08:00"],
  medications: [{ drugCode: "D01", atcCode: "A01", drugName: "타이레놀", takeTimes: ["08:00"] }],
};

describe("useIngredientAnalysisStore", () => {
  beforeEach(() => {
    useIngredientAnalysisStore.setState({ request: null });
  });

  it("초기 request는 null이다", () => {
    expect(useIngredientAnalysisStore.getState().request).toBeNull();
  });

  it("setRequest로 request를 설정한다", () => {
    useIngredientAnalysisStore.getState().setRequest(BASE_REQUEST);

    expect(useIngredientAnalysisStore.getState().request).toEqual(BASE_REQUEST);
  });

  it("clearRequest로 request를 초기화한다", () => {
    useIngredientAnalysisStore.getState().setRequest(BASE_REQUEST);
    useIngredientAnalysisStore.getState().clearRequest();

    expect(useIngredientAnalysisStore.getState().request).toBeNull();
  });
});
