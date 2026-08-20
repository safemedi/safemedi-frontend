import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type {
  FetchNearbyMedicalFacilitiesParams,
  NearbyMedicalFacilitiesResponse,
} from "@/api/types/map";

export async function fetchNearbyMedicalFacilities(
  params: FetchNearbyMedicalFacilitiesParams,
): Promise<NearbyMedicalFacilitiesResponse> {
  return api
    .get(apiPaths.mapFacilities, {
      searchParams: {
        latitude: params.latitude,
        longitude: params.longitude,
        category: params.category,
        keyword: params.keyword,
      },
    })
    .json<NearbyMedicalFacilitiesResponse>();
}
