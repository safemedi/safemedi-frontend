import * as Location from "expo-location";
import { Platform } from "react-native";
import { apiConfig } from "@/constants/api-config";
import type { MapCoordinate, MapRegion } from "./types";

const DEFAULT_REGION_DELTA = {
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
} as const;

const CURRENT_POSITION_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.Balanced,
  mayShowUserSettingsDialog: false,
  timeInterval: 120_000,
};

const LOW_ACCURACY_POSITION_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.Lowest,
  mayShowUserSettingsDialog: false,
  timeInterval: 120_000,
};

const HIGH_ACCURACY_POSITION_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.High,
  mayShowUserSettingsDialog: false,
  timeInterval: 120_000,
};

const WATCH_POSITION_OPTIONS: Location.LocationOptions = {
  accuracy: Platform.OS === "android" ? Location.Accuracy.High : Location.Accuracy.Lowest,
  mayShowUserSettingsDialog: false,
  timeInterval: 1000,
  distanceInterval: 0,
};

const WATCH_POSITION_TIMEOUT_MS = 30_000;
const CURRENT_POSITION_ATTEMPT_TIMEOUT_MS = 10_000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(LOCATION_UNAVAILABLE_ERROR));
    }, timeoutMs);
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId));
  });
}

export const DEV_FALLBACK_COORDINATE: MapCoordinate = {
  latitude: 37.5665,
  longitude: 126.978,
};

export const DEV_FALLBACK_ADDRESS = "개발용 기본 위치 (서울)";

export const LOCATION_UNAVAILABLE_ERROR =
  "현재 위치를 확인할 수 없습니다. 기기의 위치 서비스를 켜고 다시 시도해 주세요.";

export const LOCATION_SERVICES_DISABLED_ERROR =
  "기기의 위치 서비스가 꺼져 있습니다. 설정에서 위치를 켠 뒤 다시 시도해 주세요.";

export const LOCATION_EMULATOR_HINT_ERROR =
  "에뮬레이터에서 위치를 받지 못했습니다. Extended controls에서 좌표를 설정하거나 실기기에서 확인해 주세요.";

export interface ResolvedMapLocation {
  readonly currentCoordinate: MapCoordinate;
  readonly currentAddress: string;
  readonly initialRegion: MapRegion;
  readonly usedDevFallback: boolean;
}

function formatAddress(address: Location.LocationGeocodedAddress | undefined): string {
  if (!address) {
    return "현재 위치";
  }

  const addressParts = [address.region, address.city, address.district, address.street].filter(
    (part): part is string => typeof part === "string" && part.trim().length > 0,
  );

  return addressParts.length > 0 ? addressParts.join(" ") : "현재 위치";
}

function createDevFallbackPosition(): Location.LocationObject {
  return {
    coords: {
      latitude: DEV_FALLBACK_COORDINATE.latitude,
      longitude: DEV_FALLBACK_COORDINATE.longitude,
      altitude: null,
      accuracy: 1000,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  };
}

async function watchForPosition(timeoutMs: number): Promise<Location.LocationObject> {
  return new Promise((resolve, reject) => {
    let subscription: Location.LocationSubscription | null = null;
    let settled = false;

    const finish = (action: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutId);
      void subscription?.remove();
      action();
    };

    const timeoutId = setTimeout(() => {
      finish(() => reject(new Error(LOCATION_UNAVAILABLE_ERROR)));
    }, timeoutMs);

    void Location.watchPositionAsync(
      WATCH_POSITION_OPTIONS,
      (location) => {
        finish(() => resolve(location));
      },
      () => {
        // 첫 fix 전 일시적 watch 오류는 timeout까지 재시도한다.
      },
    )
      .then((nextSubscription) => {
        if (settled) {
          nextSubscription?.remove();
          return;
        }
        subscription = nextSubscription;
      })
      .catch((error: unknown) => {
        finish(() =>
          reject(error instanceof Error ? error : new Error(LOCATION_UNAVAILABLE_ERROR)),
        );
      });
  });
}

async function throwLocationUnavailableError(): Promise<never> {
  const providerStatus = await Location.getProviderStatusAsync();
  if (!providerStatus.locationServicesEnabled) {
    throw new Error(LOCATION_SERVICES_DISABLED_ERROR);
  }
  if (__DEV__ && Platform.OS === "android") {
    throw new Error(LOCATION_EMULATOR_HINT_ERROR);
  }
  throw new Error(LOCATION_UNAVAILABLE_ERROR);
}

async function resolveCurrentPosition(): Promise<Location.LocationObject> {
  if (Platform.OS === "android") {
    try {
      await Location.enableNetworkProviderAsync();
    } catch {
      // 네트워크 기반 위치 모드 활성화를 거부해도 다른 경로로 재시도한다.
    }
  }

  const lastKnownPosition = await Location.getLastKnownPositionAsync({
    maxAge: 60_000,
    requiredAccuracy: 1_000,
  });
  if (lastKnownPosition) {
    return lastKnownPosition;
  }

  const positionAttempts = [
    () =>
      withTimeout(
        Location.getCurrentPositionAsync(HIGH_ACCURACY_POSITION_OPTIONS),
        CURRENT_POSITION_ATTEMPT_TIMEOUT_MS,
      ),
    () =>
      withTimeout(
        Location.getCurrentPositionAsync(CURRENT_POSITION_OPTIONS),
        CURRENT_POSITION_ATTEMPT_TIMEOUT_MS,
      ),
    () =>
      withTimeout(
        Location.getCurrentPositionAsync(LOW_ACCURACY_POSITION_OPTIONS),
        CURRENT_POSITION_ATTEMPT_TIMEOUT_MS,
      ),
    () => withTimeout(watchForPosition(WATCH_POSITION_TIMEOUT_MS), WATCH_POSITION_TIMEOUT_MS),
  ];

  for (const attempt of positionAttempts) {
    try {
      return await attempt();
    } catch {
      // 다음 fallback 경로로 이어서 시도한다.
    }
  }

  return throwLocationUnavailableError();
}

export async function resolveMapLocation(): Promise<ResolvedMapLocation> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") {
    throw new Error("위치 권한이 허용되지 않았습니다.");
  }

  let currentPosition: Location.LocationObject;
  let usedDevFallback = false;

  try {
    currentPosition = await resolveCurrentPosition();
  } catch (error: unknown) {
    if (__DEV__ && apiConfig.useMock) {
      currentPosition = createDevFallbackPosition();
      usedDevFallback = true;
    } else {
      throw error;
    }
  }

  const currentCoordinate: MapCoordinate = {
    latitude: currentPosition.coords.latitude,
    longitude: currentPosition.coords.longitude,
  };

  let currentAddress = usedDevFallback ? DEV_FALLBACK_ADDRESS : "현재 위치";
  if (!usedDevFallback) {
    try {
      const reverseGeocodedAddresses = await Location.reverseGeocodeAsync(currentCoordinate);
      currentAddress = formatAddress(reverseGeocodedAddresses[0]);
    } catch {
      // 좌표는 확보됐지만 역지오코딩만 실패한 경우 지도 표시는 계속한다.
    }
  }

  return {
    currentCoordinate,
    currentAddress,
    initialRegion: {
      ...currentCoordinate,
      ...DEFAULT_REGION_DELTA,
    },
    usedDevFallback,
  };
}
