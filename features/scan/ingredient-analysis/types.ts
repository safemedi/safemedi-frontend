import type {
  AnalyzeIngredientMedication,
  AnalyzeIngredientsRequest,
  AnalyzeIngredientsResponse,
} from "@/api/types";

export interface RiskTone {
  readonly label: string;
  readonly startColor: string;
  readonly endColor: string;
  readonly badgeBackground: string;
  readonly badgeTextColor: string;
}

export interface IngredientAnalysisViewModel {
  readonly request: AnalyzeIngredientsRequest | null;
  readonly result: AnalyzeIngredientsResponse | null;
  readonly isAnalyzing: boolean;
  readonly isSubmitting: boolean;
  readonly errorMessage: string | null;
  readonly handlePressClose: () => void;
  readonly handlePressCancel: () => void;
  readonly handlePressRetryAnalysis: () => Promise<void>;
  readonly handlePressConfirm: () => Promise<void>;
}

export interface MedicationAnalysisCardModel extends AnalyzeIngredientMedication {
  readonly riskLabel: string;
}
