import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "safemedi-device-token-cleanup";
interface DeviceTokenState {
  registeredToken: string | null;
  pendingTokens: string[];
}

let state: DeviceTokenState = { registeredToken: null, pendingTokens: [] };
let hydration: Promise<void> | null = null;
let writes: Promise<void> = Promise.resolve();

export function restoreDeviceTokenState(): Promise<void> {
  if (!hydration) {
    hydration = AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved: unknown = JSON.parse(raw);
        if (!saved || typeof saved !== "object") return;
        const record = saved as Record<string, unknown>;
        state = {
          registeredToken:
            typeof record.registeredToken === "string" ? record.registeredToken : null,
          pendingTokens: Array.isArray(record.pendingTokens)
            ? record.pendingTokens.filter(
                (token): token is string => typeof token === "string" && token.length > 0,
              )
            : [],
        };
      })
      .catch((error: unknown) => {
        hydration = null;
        throw error;
      });
  }
  return hydration;
}

async function updateState(
  createNextState: (current: DeviceTokenState) => DeviceTokenState,
): Promise<void> {
  await restoreDeviceTokenState();
  const write = writes.then(async () => {
    const nextState = createNextState(state);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    state = nextState;
  });
  writes = write.catch(() => {});
  return write;
}

export function getRegisteredDeviceToken(): string | null {
  return state.registeredToken;
}

export function setRegisteredDeviceToken(token: string | null): Promise<void> {
  return updateState((current) => {
    const pendingTokens = [...current.pendingTokens];
    const previousToken = current.registeredToken;
    if (
      token &&
      previousToken &&
      token !== previousToken &&
      !pendingTokens.includes(previousToken)
    ) {
      pendingTokens.push(previousToken);
    }
    return { registeredToken: token, pendingTokens };
  });
}

export function clearRegisteredDeviceToken(): Promise<void> {
  return setRegisteredDeviceToken(null);
}

export function getPendingDeviceTokenCleanups(): readonly string[] {
  return [...state.pendingTokens];
}

export function markDeviceTokenCleanupPending(token: string): Promise<void> {
  return updateState((current) => ({
    ...current,
    pendingTokens: current.pendingTokens.includes(token)
      ? [...current.pendingTokens]
      : [...current.pendingTokens, token],
  }));
}

export function clearPendingDeviceTokenCleanup(token: string): Promise<void> {
  return updateState((current) => ({
    ...current,
    pendingTokens: current.pendingTokens.filter((pending) => pending !== token),
  }));
}
