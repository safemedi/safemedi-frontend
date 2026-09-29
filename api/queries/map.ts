import { useQuery } from "@tanstack/react-query";
import { fetchNearbyMedicalFacilities } from "@/api/endpoints/map";
import { queryKeys } from "@/api/query-keys";
import type { FetchNearbyMedicalFacilitiesParams, MedicalFacilityCategory } from "@/api/types/map";
import { useSessionStore } from "@/stores/sessionStore";

const STALE_MS = 60 * 1000;

interface UseNearbyMedicalFacilitiesQueryParams {
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly category: MedicalFacilityCategory;
  readonly keyword: string;
}

function hasValidCoordinate(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function useNearbyMedicalFacilitiesQuery(params: UseNearbyMedicalFacilitiesQueryParams) {
  const accessToken = useSessionStore((state) => state.accessToken);
  const hasCoordinates =
    hasValidCoordinate(params.latitude) && hasValidCoordinate(params.longitude);
  const normalizedKeyword = params.keyword.trim();

  const queryLatitude = hasCoordinates ? params.latitude : 0;
  const queryLongitude = hasCoordinates ? params.longitude : 0;

  return useQuery({
    queryKey: queryKeys.map.nearbyFacilities(
      queryLatitude,
      queryLongitude,
      params.category,
      normalizedKeyword,
    ),
    enabled: !!accessToken && hasCoordinates,
    staleTime: STALE_MS,
    queryFn: () =>
      fetchNearbyMedicalFacilities({
        latitude: queryLatitude,
        longitude: queryLongitude,
        category: params.category,
        keyword: normalizedKeyword,
      } satisfies FetchNearbyMedicalFacilitiesParams),
  });
}
