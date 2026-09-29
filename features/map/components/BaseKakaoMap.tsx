import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type LayoutChangeEvent, Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { palette } from "@/constants/design-tokens";
import type { MapCoordinate, MapFacilityMarker, MapRegion } from "../types";
import { buildKakaoMapHtml, regionToKakaoMapLevel } from "./kakaoMapHtml";

const MAP_WEBVIEW_BASE_URL = "https://127.0.0.1";

const RELAYOUT_INJECT_SCRIPT = `
  (function () {
    if (typeof map !== "undefined" && map && typeof map.relayout === "function") {
      map.relayout();
    }
  })();
  true;
`;

function getKakaoMapJsKey(): string {
  return process.env.EXPO_PUBLIC_KAKAO_MAP_JS_KEY ?? "";
}

export interface BaseKakaoMapProps {
  readonly initialRegion: MapRegion;
  readonly currentCoordinate: MapCoordinate;
  readonly facilities: readonly MapFacilityMarker[];
  readonly onSelectFacility: (facilityId: string) => void;
  readonly onMapReady?: () => void;
  readonly onMapError?: (errorCode: string) => void;
}

interface KakaoMapWebMessage {
  readonly type: string;
  readonly facilityId?: string;
  readonly message?: string;
  readonly count?: number;
  readonly origin?: string;
  readonly href?: string;
  readonly metrics?: {
    readonly width: number;
    readonly height: number;
    readonly childCount: number;
  };
}

interface MapWebViewCommand {
  readonly type: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly level?: number;
  readonly width?: number;
  readonly height?: number;
  readonly markers?: readonly MapFacilityMarker[];
}

interface MapLayout {
  readonly width: number;
  readonly height: number;
}

interface MapCameraState {
  readonly latitude: number;
  readonly longitude: number;
  readonly level: number;
}

function serializeMarkers(markers: readonly MapFacilityMarker[]): readonly MapFacilityMarker[] {
  return markers.map((marker) => ({
    id: marker.id,
    latitude: marker.latitude,
    longitude: marker.longitude,
    category: marker.category,
  }));
}

function buildInjectMapCommandScript(command: MapWebViewCommand): string {
  const serializedCommand = JSON.stringify(command);
  return `(function(){if(window.handleMapCommand){window.handleMapCommand(${serializedCommand});}})();true;`;
}

export function BaseKakaoMap({
  initialRegion,
  currentCoordinate,
  facilities,
  onSelectFacility,
  onMapReady,
  onMapError,
}: BaseKakaoMapProps) {
  const webViewRef = useRef<WebView>(null);
  const isMapReadyRef = useRef(false);
  const latestMarkersRef = useRef<readonly MapFacilityMarker[]>([]);
  const latestCameraRef = useRef<MapCameraState>({
    latitude: currentCoordinate.latitude,
    longitude: currentCoordinate.longitude,
    level: regionToKakaoMapLevel(initialRegion.latitudeDelta),
  });
  const latestLayoutRef = useRef<MapLayout>({ width: 0, height: 0 });
  const [mapLayout, setMapLayout] = useState<MapLayout>({ width: 0, height: 0 });
  const mapJsKey = getKakaoMapJsKey();
  const mapLevel = regionToKakaoMapLevel(initialRegion.latitudeDelta);
  const serializedFacilities = useMemo(() => serializeMarkers(facilities), [facilities]);
  const hasMapLayout = mapLayout.width > 0 && mapLayout.height > 0;

  const html = useMemo(
    () =>
      buildKakaoMapHtml({
        mapJsKey,
        latitude: initialRegion.latitude,
        longitude: initialRegion.longitude,
        level: mapLevel,
        facilities: [],
        mapWidth: hasMapLayout ? mapLayout.width : undefined,
        mapHeight: hasMapLayout ? mapLayout.height : undefined,
      }),
    [
      hasMapLayout,
      initialRegion.latitude,
      initialRegion.longitude,
      mapJsKey,
      mapLayout.height,
      mapLayout.width,
      mapLevel,
    ],
  );

  const dispatchCommand = useCallback((command: MapWebViewCommand) => {
    webViewRef.current?.postMessage(JSON.stringify(command));
    if (Platform.OS === "ios") {
      webViewRef.current?.injectJavaScript(buildInjectMapCommandScript(command));
    }
  }, []);

  const syncMapState = useCallback(() => {
    if (!isMapReadyRef.current) {
      return;
    }

    const layout = latestLayoutRef.current;
    if (layout.width > 0 && layout.height > 0) {
      dispatchCommand({
        type: "setSize",
        width: layout.width,
        height: layout.height,
      });
    }

    const camera = latestCameraRef.current;
    dispatchCommand({
      type: "setCamera",
      latitude: camera.latitude,
      longitude: camera.longitude,
      level: camera.level,
    });

    dispatchCommand({
      type: "setMarkers",
      markers: latestMarkersRef.current,
    });

    webViewRef.current?.injectJavaScript(RELAYOUT_INJECT_SCRIPT);
  }, [dispatchCommand]);

  const requestRelayout = useCallback(() => {
    dispatchCommand({ type: "relayout" });
    webViewRef.current?.injectJavaScript(RELAYOUT_INJECT_SCRIPT);
  }, [dispatchCommand]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    latestLayoutRef.current = { width, height };
    setMapLayout((previousLayout) => {
      if (previousLayout.width === width && previousLayout.height === height) {
        return previousLayout;
      }
      return { width, height };
    });
  }, []);

  useEffect(() => {
    latestMarkersRef.current = serializedFacilities;
    syncMapState();
  }, [serializedFacilities, syncMapState]);

  useEffect(() => {
    latestCameraRef.current = {
      latitude: currentCoordinate.latitude,
      longitude: currentCoordinate.longitude,
      level: mapLevel,
    };
    syncMapState();
  }, [currentCoordinate.latitude, currentCoordinate.longitude, mapLevel, syncMapState]);

  useEffect(() => {
    if (!hasMapLayout) {
      return;
    }
    latestLayoutRef.current = mapLayout;
    syncMapState();
  }, [hasMapLayout, mapLayout, syncMapState]);

  useFocusEffect(
    useCallback(() => {
      syncMapState();
      requestRelayout();
    }, [requestRelayout, syncMapState]),
  );

  const handleMessage = (rawMessage: string) => {
    try {
      const message = JSON.parse(rawMessage) as KakaoMapWebMessage;
      if (__DEV__ && (message.type === "debug" || message.type === "error")) {
        console.warn("[BaseKakaoMap]", message);
      }
      if (message.type === "ready") {
        isMapReadyRef.current = true;
        syncMapState();
        onMapReady?.();
        return;
      }
      if (message.type === "error" && message.message) {
        onMapError?.(message.message);
        return;
      }
      if (message.type === "selectFacility" && message.facilityId) {
        onSelectFacility(message.facilityId);
      }
    } catch {
      // WebView에서 전달된 비정상 메시지는 무시한다.
    }
  };

  useEffect(() => {
    if (mapJsKey.length === 0) {
      onMapError?.("missing_map_key");
    }
  }, [mapJsKey, onMapError]);

  if (mapJsKey.length === 0) {
    return null;
  }

  return (
    <View
      testID="kakao-map-container"
      style={styles.container}
      onLayout={handleLayout}
      collapsable={false}
    >
      {hasMapLayout ? (
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html, baseUrl: MAP_WEBVIEW_BASE_URL }}
          style={styles.map}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          contentInsetAdjustmentBehavior="never"
          mixedContentMode="always"
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          onLoadStart={() => {
            isMapReadyRef.current = false;
          }}
          onLoadEnd={syncMapState}
          onMessage={(event) => handleMessage(event.nativeEvent.data)}
          onError={() => {
            onMapError?.("map_load_error");
          }}
          onHttpError={() => {
            onMapError?.("webview_http_error");
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    backgroundColor: palette.map_webview_background,
  },
});
