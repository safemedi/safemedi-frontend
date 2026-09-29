import { useEffect, useState } from "react";
import { useSessionStore } from "@/stores/sessionStore";

/** Zustand persist 복원 완료 후에만 true (토큰 유무 판단용) */
export function useSessionHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useSessionStore.persist.hasHydrated());

  useEffect(() => {
    const unsub = useSessionStore.persist.onFinishHydration(() => setHydrated(true));
    if (useSessionStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  return hydrated;
}
