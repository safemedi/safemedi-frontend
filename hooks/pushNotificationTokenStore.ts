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

function persistState(): Promise<void> {
  const snapshot = JSON.stringify(state);
  const write = writes.then(() => AsyncStorage.setItem(STORAGE_KEY, snapshot));
  writes = write.catch(() => {});
  return write;
}

export function getRegisteredDeviceToken(): string | null {
  return state.registeredToken;
}

export async function setRegisteredDeviceToken(token: string | null): Promise<void> {
  await restoreDeviceTokenState();
  const previousToken = state.registeredToken;
  if (
    token &&
    previousToken &&
    token !== previousToken &&
    !state.pendingTokens.includes(previousToken)
  ) {
    state.pendingTokens.push(previousToken);
  }
  state.registeredToken = token;
  await persistState();
}

export function clearRegisteredDeviceToken(): Promise<void> {
  return setRegisteredDeviceToken(null);
}

export function getPendingDeviceTokenCleanups(): readonly string[] {
  return [...state.pendingTokens];
}

export async function markDeviceTokenCleanupPending(token: string): Promise<void> {
  await restoreDeviceTokenState();
  if (!state.pendingTokens.includes(token)) state.pendingTokens.push(token);
  await persistState();
}

export async function clearPendingDeviceTokenCleanup(token: string): Promise<void> {
  await restoreDeviceTokenState();
  state.pendingTokens = state.pendingTokens.filter((pending) => pending !== token);
  await persistState();
}
