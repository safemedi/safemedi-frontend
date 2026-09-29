import { Redirect } from "expo-router";
import { AuthGateView } from "@/components/AuthGateView";
import { useAuthRouteState } from "@/hooks/useAuthRouteState";

export default function IndexRedirect() {
  const authState = useAuthRouteState();

  if (authState.kind === "loading") {
    return <AuthGateView kind="loading" />;
  }

  if (authState.kind === "error") {
    return <AuthGateView kind="error" onRetry={authState.retry} onLogout={authState.logout} />;
  }

  return <Redirect href={authState.href} />;
}
