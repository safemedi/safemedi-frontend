import { render } from "@testing-library/react-native";
import IngredientAnalysisDetailRoute from "../ingredient-analysis";

const mockIngredientAnalysisScreen = jest.fn(() => null);

jest.mock("@/features/scan/ingredient-analysis/IngredientAnalysisScreen", () => ({
  IngredientAnalysisScreen: () => mockIngredientAnalysisScreen(),
}));

describe("app/(detail)/scan/ingredient-analysis route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("IngredientAnalysisScreen을 렌더링한다", () => {
    render(<IngredientAnalysisDetailRoute />);

    expect(mockIngredientAnalysisScreen).toHaveBeenCalledTimes(1);
  });
});
