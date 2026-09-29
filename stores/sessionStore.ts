import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type SessionState = {
  accessToken: string | null;
  refreshToken: string | null;
  isTutorialCompleted: boolean;
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  setTutorialCompleted: (isCompleted: boolean) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      isTutorialCompleted: false,
      setAccessToken: (accessToken) => set({ accessToken }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      setTutorialCompleted: (isTutorialCompleted) => set({ isTutorialCompleted }),
      clearSession: () =>
        set({ accessToken: null, refreshToken: null, isTutorialCompleted: false }),
    }),
    {
      name: "safemedi-session",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        isTutorialCompleted: s.isTutorialCompleted,
      }),
    },
  ),
);
