import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SelectChip } from "@/components/ui/SelectChip";
import { layout, palette } from "@/constants/design-tokens";
import { BaseKakaoMap } from "./components/BaseKakaoMap";
import { MedicalFacilityCard } from "./components/MedicalFacilityCard";
import type { MedicalFacility } from "./types";
import { useMapViewModel } from "./useMapViewModel";

const CATEGORY_OPTIONS = [
  { label: "전체", value: "all" },
  { label: "약국", value: "pharmacy" },
  { label: "응급실", value: "emergency" },
] as const;

type MapLoadState = "loading" | "ready" | "error";

function resolveMapLoadErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case "missing_map_key":
      return "지도 설정이 올바르지 않아 지도를 표시할 수 없습니다.";
    case "kakao_sdk_script_error":
    case "kakao_sdk_unavailable":
      return "지도 SDK를 불러오지 못했습니다.";
    case "map_init_timeout":
      return "지도 로딩 시간이 초과되었습니다.";
    case "map_container_zero_size":
      return "지도 영역을 초기화하지 못했습니다.";
    case "map_tiles_missing":
      return "지도 타일을 불러오지 못했습니다.";
    default:
      return "지도를 불러오지 못했습니다.";
  }
}

function toMapSearchUrl(facility: MedicalFacility): string {
  if (facility.placeUrl) {
    return facility.placeUrl;
  }
  return `https://map.kakao.com/link/map/${facility.latitude},${facility.longitude}`;
}

export function MapScreen() {
  const viewModel = useMapViewModel();
  const [mapLoadState, setMapLoadState] = useState<MapLoadState>("loading");
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
  const [mapLoadAttempt, setMapLoadAttempt] = useState(0);

  const regionKey = viewModel.initialRegion
    ? `${viewModel.initialRegion.latitude},${viewModel.initialRegion.longitude}`
    : null;
  const previousRegionKeyRef = useRef<string | null>(regionKey);

  useEffect(() => {
    if (!regionKey || previousRegionKeyRef.current === regionKey) {
      return;
    }

    previousRegionKeyRef.current = regionKey;
    setMapLoadState("loading");
    setMapLoadError(null);
  }, [regionKey]);

  const handleMapReady = useCallback(() => {
    setMapLoadState("ready");
    setMapLoadError(null);
  }, []);

  const handleMapError = useCallback((errorCode: string) => {
    setMapLoadState("error");
    setMapLoadError(resolveMapLoadErrorMessage(errorCode));
  }, []);

  const handleRetryMap = useCallback(() => {
    setMapLoadAttempt((previous) => previous + 1);
    setMapLoadState("loading");
    setMapLoadError(null);
  }, []);

  const markers = viewModel.facilities.map((facility) => ({
    id: facility.id,
    latitude: facility.latitude,
    longitude: facility.longitude,
    category: facility.category,
  }));

  const openExternalUrl = useCallback(async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      return;
    }
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error("Failed to open external URL:", url, error);
    }
  }, []);

  const handlePressCall = useCallback(
    async (facility: MedicalFacility) => {
      if (!facility.phoneNumber) {
        return;
      }
      await openExternalUrl(`tel:${facility.phoneNumber}`);
    },
    [openExternalUrl],
  );

  const handlePressDirections = useCallback(
    async (facility: MedicalFacility) => {
      await openExternalUrl(toMapSearchUrl(facility));
    },
    [openExternalUrl],
  );

  if (viewModel.isLoadingLocation) {
    return (
      <View style={styles.centeredContainer}>
        <LoadingSpinner size="small" accessibilityLabel="현재 위치 로딩 중" />
        <Text style={styles.loadingText}>현재 위치를 불러오는 중이에요.</Text>
      </View>
    );
  }

  if (!viewModel.initialRegion || !viewModel.currentCoordinate) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>
          {viewModel.locationError ??
            "현재 위치를 확인할 수 없어 주변 의료기관을 표시할 수 없습니다."}
        </Text>
        <Pressable onPress={viewModel.retryLocation} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>위치 다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  const isContentReady = mapLoadState === "ready";
  const showBlockingOverlay = !isContentReady;
  const showFacilitiesLoading = viewModel.isLoadingFacilities || viewModel.isRefreshingFacilities;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {showBlockingOverlay ? (
        <View style={styles.blockingOverlay}>
          {mapLoadState === "error" ? (
            <>
              <Text style={styles.errorText}>{mapLoadError ?? "지도를 불러오지 못했습니다."}</Text>
              <Pressable onPress={handleRetryMap} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>지도 다시 시도</Text>
              </Pressable>
            </>
          ) : (
            <>
              <LoadingSpinner size="small" accessibilityLabel="주변 의료기관 지도 로딩 중" />
              <Text style={styles.loadingText}>주변 의료기관 지도를 불러오는 중이에요.</Text>
            </>
          )}
        </View>
      ) : null}

      {isContentReady ? (
        <View style={styles.topSection}>
          <Text style={styles.title}>주변 의료기관</Text>
          {viewModel.isUsingDevFallbackLocation ? (
            <Text style={styles.devFallbackText}>
              실제 GPS를 받지 못해 개발용 기본 위치를 사용 중입니다.
            </Text>
          ) : null}
          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={18} color={palette.input_placeholder} />
            <TextInput
              value={viewModel.inputKeyword}
              onChangeText={viewModel.setInputKeyword}
              onSubmitEditing={viewModel.submitSearch}
              placeholder="약국, 병원 검색..."
              placeholderTextColor={palette.input_placeholder}
              returnKeyType="search"
              style={styles.searchInput}
            />
          </View>
          <View style={styles.categoryRow}>
            {CATEGORY_OPTIONS.map((option) => (
              <SelectChip
                key={option.value}
                label={option.label}
                selected={viewModel.category === option.value}
                onPress={() => viewModel.setCategory(option.value)}
                flex={1}
                height={34}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View
        style={styles.mapSection}
        collapsable={false}
        pointerEvents={isContentReady ? "auto" : "none"}
      >
        <BaseKakaoMap
          key={mapLoadAttempt}
          initialRegion={viewModel.initialRegion}
          currentCoordinate={viewModel.currentCoordinate}
          facilities={markers}
          onSelectFacility={viewModel.setSelectedFacilityId}
          onMapReady={handleMapReady}
          onMapError={handleMapError}
        />
      </View>

      {isContentReady ? (
        <ScrollView
          style={styles.listSection}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.listHeaderRow}>
            <Text style={styles.listHeaderText}>{viewModel.facilities.length}개 의료기관</Text>
          </View>
          {showFacilitiesLoading ? (
            <LoadingSpinner size="small" accessibilityLabel="의료기관 목록 로딩 중" />
          ) : null}
          {viewModel.facilitiesError ? (
            <Text style={styles.errorText}>
              목록을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.
            </Text>
          ) : null}
          {viewModel.facilities.map((facility) => (
            <MedicalFacilityCard
              key={facility.id}
              facility={facility}
              onPressCall={handlePressCall}
              onPressDirections={handlePressDirections}
            />
          ))}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.transparent },
  blockingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: palette.white,
    zIndex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: { marginTop: 8, color: palette.icon },
  errorText: { color: palette.red_strong, fontSize: 14, textAlign: "center" },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: palette.green,
  },
  retryButtonText: { color: palette.white, fontSize: 14, fontWeight: "600" },
  devFallbackText: { fontSize: 12, color: palette.icon, lineHeight: 18 },
  topSection: {
    backgroundColor: palette.transparent,
    borderBottomWidth: 1,
    borderBottomColor: palette.map_search_border,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    gap: 8,
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "700",
    color: palette.title_emphasis,
    letterSpacing: -0.3,
  },
  searchWrapper: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border_muted,
    backgroundColor: palette.overlay_white_25,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: palette.title_emphasis },
  categoryRow: { flexDirection: "row", gap: 8 },
  mapSection: { height: 210, overflow: "hidden" },
  listSection: { flex: 1, backgroundColor: palette.transparent },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: layout.tabScreenBottomSpacing,
    gap: 12,
  },
  listHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  listHeaderText: { fontSize: 20, fontWeight: "700", color: palette.black },
});
