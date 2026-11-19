import { create } from "zustand";
import type { AnalyzeIngredientsRequest } from "@/api/types";

import { useSessionStore } from "@/stores/sessionStore";

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

useSessionStore.subscribe((state, previous) => {
  if (state.sessionVersion !== previous.sessionVersion)
    useIngredientAnalysisStore.getState().clearRequest();
});
