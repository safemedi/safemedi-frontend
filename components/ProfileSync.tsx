import { useEffect } from "react";

import { useUserProfile } from "@/api/queries/user";
import { useSessionHydrated } from "@/hooks/useSessionHydrated";
import { useSessionStore } from "@/stores/sessionStore";
import { useUserStore } from "@/stores/userStore";
import { profileToUser } from "@/utils/user-mapper";

/**
 * 서버 프로필(TanStack Query)을 로컬 UI 스토어와 맞춥니다.
 * 튜토리얼 스텝 폼은 기존 `useUserStore`를 유지합니다.
 */
export function ProfileSync() {
  const hydrated = useSessionHydrated();
  const accessToken = useSessionStore((s) => s.accessToken);
  const { data: profile } = useUserProfile();
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) {
      clearUser();
      return;
    }
    if (profile) {
      setUser(profileToUser(profile));
    }
  }, [hydrated, accessToken, profile, setUser, clearUser]);

  return null;
}
