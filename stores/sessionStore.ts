import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type SessionState = {
  sessionVersion: number;
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
      sessionVersion: 0,
      accessToken: null,
      refreshToken: null,
      isTutorialCompleted: false,
      setAccessToken: (accessToken) =>
        set((state) => ({
          accessToken,
          sessionVersion:
            Boolean(state.accessToken) === Boolean(accessToken)
              ? state.sessionVersion
              : state.sessionVersion + 1,
        })),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      setTutorialCompleted: (isTutorialCompleted) => set({ isTutorialCompleted }),
      clearSession: () =>
        set((state) => ({
          accessToken: null,
          refreshToken: null,
          isTutorialCompleted: false,
          sessionVersion: state.sessionVersion + 1,
        })),
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
