import AsyncStorage from "@react-native-async-storage/async-storage";

const mockStorage = new Map<string, string>();
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      mockStorage.set(key, value);
    }),
  },
}));

function loadStore() {
  let loaded: typeof import("../pushNotificationTokenStore") | undefined;
  jest.isolateModules(() => {
    loaded = require("../pushNotificationTokenStore");
  });
  if (!loaded) throw new Error("토큰 저장소를 불러오지 못했습니다.");
  return loaded;
}

beforeEach(() => {
  mockStorage.clear();
  jest.mocked(AsyncStorage.setItem).mockImplementation(async (key, value) => {
    mockStorage.set(key, value);
  });
});

it("앱 재시작 후에도 현재 토큰과 보류된 정리 대상을 복구한다", async () => {
  const store = loadStore();
  await store.setRegisteredDeviceToken("device-a");
  await store.markDeviceTokenCleanupPending("device-a");
  const restarted = loadStore();
  await restarted.restoreDeviceTokenState();
  expect(restarted.getRegisteredDeviceToken()).toBe("device-a");
  expect(restarted.getPendingDeviceTokenCleanups()).toEqual(["device-a"]);
});

it("로컬 토큰을 비워도 보류 작업은 남고 성공한 토큰만 제거한다", async () => {
  const store = loadStore();
  await store.setRegisteredDeviceToken("device-b");
  await store.markDeviceTokenCleanupPending("device-a");
  await store.markDeviceTokenCleanupPending("device-b");
  await store.markDeviceTokenCleanupPending("device-b");
  await store.clearRegisteredDeviceToken();
  expect(store.getPendingDeviceTokenCleanups()).toEqual(["device-a", "device-b"]);
  await store.clearPendingDeviceTokenCleanup("device-a");
  const restarted = loadStore();
  await restarted.restoreDeviceTokenState();
  expect(restarted.getRegisteredDeviceToken()).toBeNull();
  expect(restarted.getPendingDeviceTokenCleanups()).toEqual(["device-b"]);
});

it("푸시 토큰이 회전하면 이전 토큰을 해제 대상으로 보관한다", async () => {
  const store = loadStore();
  await store.setRegisteredDeviceToken("previous-token");
  await store.setRegisteredDeviceToken("rotated-token");
  expect(store.getRegisteredDeviceToken()).toBe("rotated-token");
  expect(store.getPendingDeviceTokenCleanups()).toEqual(["previous-token"]);
});

it("저장 실패 시 메모리 상태를 변경하지 않는다", async () => {
  const store = loadStore();
  await store.setRegisteredDeviceToken("device-a");
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error("storage unavailable"));
  await expect(store.markDeviceTokenCleanupPending("device-a")).rejects.toThrow(
    "storage unavailable",
  );
  expect(store.getPendingDeviceTokenCleanups()).toEqual([]);
  await store.markDeviceTokenCleanupPending("device-a");
  expect(store.getPendingDeviceTokenCleanups()).toEqual(["device-a"]);
});

it("동시에 들어온 상태 변경도 순서대로 저장한다", async () => {
  const store = loadStore();
  await store.setRegisteredDeviceToken("device-a");
  await Promise.all([
    store.markDeviceTokenCleanupPending("device-a"),
    store.setRegisteredDeviceToken("device-b"),
    store.markDeviceTokenCleanupPending("device-b"),
  ]);
  expect(store.getRegisteredDeviceToken()).toBe("device-b");
  expect(store.getPendingDeviceTokenCleanups()).toEqual(["device-a", "device-b"]);
  const restarted = loadStore();
  await restarted.restoreDeviceTokenState();
  expect(restarted.getPendingDeviceTokenCleanups()).toEqual(["device-a", "device-b"]);
});
