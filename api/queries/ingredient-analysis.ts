import { useMutation } from "@tanstack/react-query";
import { analyzePrescriptionIngredients } from "@/api/endpoints/ingredient-analysis";
import { queryKeys } from "@/api/query-keys";
import type { AnalyzeIngredientsRequest } from "@/api/types";

export function useAnalyzeIngredientsMutation() {
  return useMutation({
    mutationKey: queryKeys.scan.analyzeIngredients,
    mutationFn: (body: AnalyzeIngredientsRequest) => analyzePrescriptionIngredients(body),
  });
}
