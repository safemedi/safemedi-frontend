import { useLocalSearchParams } from "expo-router";

import { InviteAcceptScreen } from "@/features/family/invite-accept";

function toToken(value: string | string[] | undefined): string | null {
  if (!value) return null;
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.length > 0 ? raw : null;
}

export default function InviteTokenRoute() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = toToken(params.token);

  return <InviteAcceptScreen token={token} />;
}
