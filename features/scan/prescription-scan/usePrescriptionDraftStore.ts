import { create } from "zustand";
import { useSessionStore } from "@/stores/sessionStore";
import type { ScanPrescriptionDraft } from "./types";

export interface PrescriptionDraftResult {
  readonly imageUri: string;
  readonly draft: ScanPrescriptionDraft;
}

interface PrescriptionDraftResultState {
  readonly result: PrescriptionDraftResult | null;
  readonly setResult: (result: PrescriptionDraftResult) => void;
  readonly clearResult: () => void;
}

export const usePrescriptionDraftStore = create<PrescriptionDraftResultState>((set) => ({
  result: null,
  setResult: (result) => set({ result }),
  clearResult: () => set({ result: null }),
}));

// 편집용 초안은 계정이 바뀌면 폐기한다. 서버 원문이나 이미지를 영구 저장하지 않는다.
useSessionStore.subscribe((state, previous) => {
  if (state.sessionVersion !== previous.sessionVersion)
    usePrescriptionDraftStore.getState().clearResult();
});
