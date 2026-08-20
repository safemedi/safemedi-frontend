import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "@/api/error";
import { useNearbyMedicalFacilitiesQuery } from "@/api/queries/map";
import { resolveMapLocation } from "./resolveMapLocation";
import type { MapCoordinate, MapRegion, MedicalFacility, MedicalFacilityCategory } from "./types";

const SEARCH_DEBOUNCE_MS = 400;

interface MapLocationState {
  readonly isLoadingLocation: boolean;
  readonly locationError: string | null;
  readonly currentAddress: string | null;
  readonly currentCoordinate: MapCoordinate | null;
  readonly initialRegion: MapRegion | null;
  readonly isUsingDevFallbackLocation: boolean;
}

export interface MapViewModel {
  readonly isLoadingLocation: boolean;
  readonly isLoadingFacilities: boolean;
  readonly isRefreshingFacilities: boolean;
  readonly locationError: string | null;
  readonly facilitiesError: string | null;
  readonly source: "kakao" | "mock";
  readonly currentAddress: string | null;
  readonly currentCoordinate: MapCoordinate | null;
  readonly initialRegion: MapRegion | null;
  readonly isUsingDevFallbackLocation: boolean;
  readonly category: MedicalFacilityCategory;
  readonly inputKeyword: string;
  readonly searchKeyword: string;
  readonly selectedFacilityId: string | null;
  readonly facilities: readonly MedicalFacility[];
  readonly setCategory: (category: MedicalFacilityCategory) => void;
  readonly setInputKeyword: (keyword: string) => void;
  readonly submitSearch: () => void;
  readonly setSelectedFacilityId: (facilityId: string | null) => void;
  readonly retryLocation: () => void;
  readonly refetchFacilities: () => Promise<void>;
}

export function useMapViewModel(): MapViewModel {
  const [locationState, setLocationState] = useState<MapLocationState>({
    isLoadingLocation: true,
    locationError: null,
    currentAddress: null,
    currentCoordinate: null,
    initialRegion: null,
    isUsingDevFallbackLocation: false,
  });
  const [category, setCategory] = useState<MedicalFacilityCategory>("all");
  const [inputKeyword, setInputKeyword] = useState<string>("");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);

  const loadCurrentLocation = useCallback(async () => {
    setLocationState((previous) => ({
      ...previous,
      isLoadingLocation: true,
      locationError: null,
    }));

    try {
      const resolvedLocation = await resolveMapLocation();

      setLocationState({
        isLoadingLocation: false,
        locationError: null,
        currentCoordinate: resolvedLocation.currentCoordinate,
        currentAddress: resolvedLocation.currentAddress,
        initialRegion: resolvedLocation.initialRegion,
        isUsingDevFallbackLocation: resolvedLocation.usedDevFallback,
      });
    } catch (error: unknown) {
      setLocationState({
        isLoadingLocation: false,
        locationError: error instanceof Error ? error.message : "현재 위치를 가져오지 못했습니다.",
        currentCoordinate: null,
        currentAddress: null,
        initialRegion: null,
        isUsingDevFallbackLocation: false,
      });
    }
  }, []);

  useEffect(() => {
    void loadCurrentLocation();
  }, [loadCurrentLocation]);

  const retryLocation = useCallback(() => {
    void loadCurrentLocation();
  }, [loadCurrentLocation]);

  const nearbyFacilitiesQuery = useNearbyMedicalFacilitiesQuery({
    latitude: locationState.currentCoordinate?.latitude ?? null,
    longitude: locationState.currentCoordinate?.longitude ?? null,
    category,
    keyword: searchKeyword,
  });

  useEffect(() => {
    const nextSearchKeyword = inputKeyword.trim();
    const debounceTimer = setTimeout(() => {
      setSearchKeyword((previous) =>
        previous === nextSearchKeyword ? previous : nextSearchKeyword,
      );
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [inputKeyword]);

  const facilities = useMemo(
    () => nearbyFacilitiesQuery.data?.facilities ?? [],
    [nearbyFacilitiesQuery.data?.facilities],
  );

  const [facilitiesErrorMessage, setFacilitiesErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const queryError = nearbyFacilitiesQuery.error;
    if (!queryError) {
      setFacilitiesErrorMessage(null);
      return;
    }

    let cancelled = false;
    void getApiErrorMessage(queryError, "주변 의료기관 정보를 불러오지 못했습니다.").then(
      (message) => {
        if (!cancelled) {
          setFacilitiesErrorMessage(message);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [nearbyFacilitiesQuery.error]);

  useEffect(() => {
    if (facilities.length === 0) {
      setSelectedFacilityId(null);
      return;
    }
    if (!selectedFacilityId || !facilities.some((facility) => facility.id === selectedFacilityId)) {
      setSelectedFacilityId(facilities[0].id);
    }
  }, [facilities, selectedFacilityId]);

  const refetchFacilities = useCallback(async () => {
    await nearbyFacilitiesQuery.refetch();
  }, [nearbyFacilitiesQuery]);

  const submitSearch = useCallback(() => {
    setSearchKeyword(inputKeyword.trim());
  }, [inputKeyword]);

  return {
    isLoadingLocation: locationState.isLoadingLocation,
    isLoadingFacilities: nearbyFacilitiesQuery.isLoading,
    isRefreshingFacilities: nearbyFacilitiesQuery.isRefetching,
    locationError: locationState.locationError,
    facilitiesError: facilitiesErrorMessage,
    source: nearbyFacilitiesQuery.data?.source ?? "mock",
    currentAddress: locationState.currentAddress,
    currentCoordinate: locationState.currentCoordinate,
    initialRegion: locationState.initialRegion,
    isUsingDevFallbackLocation: locationState.isUsingDevFallbackLocation,
    category,
    inputKeyword,
    searchKeyword,
    selectedFacilityId,
    facilities,
    setCategory,
    setInputKeyword,
    submitSearch,
    setSelectedFacilityId,
    retryLocation,
    refetchFacilities,
  };
}
