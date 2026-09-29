import { create } from "zustand";
import type { TutorialAllergyItem } from "@/api/types/tutorial";

/** 앱 UI·튜토리얼 폼용 로컬 모델. 서버 진실은 `useUserProfile` + `UserProfile` */
export type User = {
  id: string;
  displayName: string | null;
  email: string | null;
  birthDate: string | null;
  height: number | null;
  weight: number | null;
  gender: "male" | "female" | null;
  bloodType:
    | "A"
    | "B"
    | "O"
    | "AB"
    | "A+"
    | "A-"
    | "B+"
    | "B-"
    | "O+"
    | "O-"
    | "AB+"
    | "AB-"
    | null;
  allergies: string[];
  allergyMappings?: Record<string, TutorialAllergyItem>;
  chronicConditions: string[];
  chronicConditionMappings?: Record<string, string>;
  isTutorial: boolean;
};

type UserState = {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (patch: Partial<Omit<User, "id">>) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateUser: (patch) =>
    set((state) => (state.user ? { user: { ...state.user, ...patch } } : state)),
  clearUser: () => set({ user: null }),
}));

/** userStore의 로컬 사용자 모델에서 파생한 프로필 히어로 데이터 */
export function useProfileUser() {
  const user = useUserStore((s) => s.user);
  return {
    name: user?.displayName ?? "사용자",
    role: "주 사용자",
  };
}

/** userStore의 로컬 사용자 모델에서 파생한 건강 정보 */
export function useHealthInfo() {
  const user = useUserStore((s) => s.user);
  return {
    allergies: user?.allergies ?? [],
    chronicConditions: user?.chronicConditions ?? [],
  };
}
