import { create } from "zustand";
import type { AnalyzeIngredientsRequest } from "@/api/types";

interface IngredientAnalysisState {
  readonly request: AnalyzeIngredientsRequest | null;
  readonly setRequest: (request: AnalyzeIngredientsRequest) => void;
  readonly clearRequest: () => void;
}

export const useIngredientAnalysisStore = create<IngredientAnalysisState>((set) => ({
  request: null,
  setRequest: (request) => set({ request }),
  clearRequest: () => set({ request: null }),
}));
