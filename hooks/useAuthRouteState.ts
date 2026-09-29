import { useEffect } from "react";

import { isUnauthorizedError } from "@/api/error";
import { useUserProfile } from "@/api/queries/user";
import { useLogout } from "@/hooks/useLogout";
import { useSessionHydrated } from "@/hooks/useSessionHydrated";
import { useSessionStore } from "@/stores/sessionStore";
import { useUserStore } from "@/stores/userStore";
import { profileToUser } from "@/utils/user-mapper";

export type AuthRouteHref = "/(auth)/login" | "/(auth)/tutorial" | "/(tabs)/dashboard";

type AuthRouteState =
  | { kind: "loading" }
  | { kind: "error"; retry: () => void; logout: () => void }
  | { kind: "redirect"; href: AuthRouteHref };

export function useAuthRouteState(): AuthRouteState {
  const hydrated = useSessionHydrated();
  const accessToken = useSessionStore((s) => s.accessToken);
  const isTutorialCompleted = useSessionStore((s) => s.isTutorialCompleted);
  const setTutorialCompleted = useSessionStore((s) => s.setTutorialCompleted);
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const logout = useLogout();
  const { data: profile, isPending, isError, error, refetch } = useUserProfile();

  useEffect(() => {
    if (!hydrated || !accessToken || !isError || !isUnauthorizedError(error)) {
      return;
    }
    logout();
  }, [hydrated, accessToken, isError, error, logout]);

  useEffect(() => {
    if (!hydrated || !accessToken || isError || !profile || user) {
      return;
    }
    setUser(profileToUser(profile));
  }, [hydrated, accessToken, isError, profile, user, setUser]);

  useEffect(() => {
    if (!hydrated || !accessToken || isError || !profile) {
      return;
    }
    if (profile.isTutorialCompleted && !isTutorialCompleted) {
      setTutorialCompleted(true);
    }
  }, [hydrated, accessToken, isError, profile, isTutorialCompleted, setTutorialCompleted]);

  if (!hydrated) {
    return { kind: "loading" };
  }

  if (!accessToken) {
    return { kind: "redirect", href: "/(auth)/login" };
  }

  if (isPending || (!isError && !profile)) {
    return { kind: "loading" };
  }

  if (isError) {
    if (isUnauthorizedError(error)) {
      return { kind: "loading" };
    }
    return { kind: "error", retry: () => void refetch(), logout };
  }

  if (!(profile.isTutorialCompleted || isTutorialCompleted)) {
    return { kind: "redirect", href: "/(auth)/tutorial" };
  }

  return { kind: "redirect", href: "/(tabs)/dashboard" };
}
