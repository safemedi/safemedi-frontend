import { create } from "zustand";
import type { ScanPrescriptionDraft } from "./types";

export interface PrescriptionOcrResult {
  readonly imageUri: string;
  readonly draft: ScanPrescriptionDraft;
}

interface PrescriptionOcrResultState {
  readonly result: PrescriptionOcrResult | null;
  readonly setResult: (result: PrescriptionOcrResult) => void;
  readonly clearResult: () => void;
}

export const usePrescriptionOcrResultStore = create<PrescriptionOcrResultState>((set) => ({
  result: null,
  setResult: (result) => set({ result }),
  clearResult: () => set({ result: null }),
}));
