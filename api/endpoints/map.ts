import type {
  FetchNearbyMedicalFacilitiesParams,
  MedicalFacility,
  MedicalFacilityCategory,
  NearbyMedicalFacilitiesResponse,
} from "@/api/types/map";

const KAKAO_CATEGORY_SEARCH_URL = "https://dapi.kakao.com/v2/local/search/category.json";
const KAKAO_KEYWORD_SEARCH_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";
const KAKAO_DEFAULT_SIZE = 15;
const KAKAO_SEARCH_RADIUS_METERS = 5_000;
const KAKAO_REQUEST_TIMEOUT_MS = 7_000;

interface KakaoLocalSearchDocument {
  readonly place_name: string;
  readonly category_name: string;
  readonly address_name: string;
  readonly road_address_name: string;
  readonly x: string;
  readonly y: string;
  readonly phone: string;
  readonly distance: string;
  readonly place_url: string;
}

interface KakaoLocalSearchResponse {
  readonly documents: readonly KakaoLocalSearchDocument[];
}

type KakaoCategoryGroupCode = "PM9" | "HP8";

interface KakaoSearchRequest {
  readonly kind: "category" | "keyword";
  readonly categoryGroupCode?: KakaoCategoryGroupCode;
  readonly query?: string;
  readonly fallbackCategory: Exclude<MedicalFacilityCategory, "all">;
}

function getKakaoRestApiKey(): string {
  return process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY ?? "";
}

function resolveSearchRequests(
  category: MedicalFacilityCategory,
  keyword: string,
): readonly KakaoSearchRequest[] {
  const normalizedKeyword = keyword.trim();

  if (category === "pharmacy") {
    if (normalizedKeyword.length > 0) {
      return [
        {
          kind: "keyword",
          query: `${normalizedKeyword} 약국`,
          categoryGroupCode: "PM9",
          fallbackCategory: "pharmacy",
        },
      ];
    }
    return [{ kind: "category", categoryGroupCode: "PM9", fallbackCategory: "pharmacy" }];
  }

  if (category === "emergency") {
    return [
      {
        kind: "keyword",
        query: normalizedKeyword.length > 0 ? `${normalizedKeyword} 응급실` : "응급실",
        categoryGroupCode: "HP8",
        fallbackCategory: "emergency",
      },
    ];
  }

  if (normalizedKeyword.length > 0) {
    return [
      {
        kind: "keyword",
        query: `${normalizedKeyword} 약국`,
        categoryGroupCode: "PM9",
        fallbackCategory: "pharmacy",
      },
      {
        kind: "keyword",
        query: `${normalizedKeyword} 응급실`,
        categoryGroupCode: "HP8",
        fallbackCategory: "emergency",
      },
    ];
  }

  return [
    { kind: "category", categoryGroupCode: "PM9", fallbackCategory: "pharmacy" },
    {
      kind: "keyword",
      query: "응급실",
      categoryGroupCode: "HP8",
      fallbackCategory: "emergency",
    },
  ];
}

function resolveFacilityCategory(
  categoryText: string,
  fallbackCategory: Exclude<MedicalFacilityCategory, "all">,
): Exclude<MedicalFacilityCategory, "all"> {
  if (categoryText.includes("약국")) {
    return "pharmacy";
  }
  if (categoryText.includes("응급") || categoryText.includes("병원")) {
    return "emergency";
  }
  return fallbackCategory;
}

function is24HoursFacility(name: string, categoryText: string): boolean {
  return name.includes("24") || categoryText.includes("24");
}

function toCoordinate(value: string, fallbackValue: number): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return fallbackValue;
  }
  return parsed;
}

function toDistanceMeters(value: string): number {
  const parsed = Number(value);
  if (!Number.isNaN(parsed) && parsed >= 0) {
    return Math.round(parsed);
  }
  return 0;
}

function resolveFallbackStatus(is24Hours: boolean): "open" | "unknown" {
  return is24Hours ? "open" : "unknown";
}

function toMedicalFacility(
  item: KakaoLocalSearchDocument,
  index: number,
  params: FetchNearbyMedicalFacilitiesParams,
  fallbackCategory: Exclude<MedicalFacilityCategory, "all">,
): MedicalFacility {
  const latitude = toCoordinate(item.y, params.latitude);
  const longitude = toCoordinate(item.x, params.longitude);
  const name = item.place_name.trim();
  const category = resolveFacilityCategory(item.category_name, fallbackCategory);
  const is24Hours = is24HoursFacility(name, item.category_name);

  return {
    id: `${category}-${name}-${index}-${latitude}-${longitude}`,
    name,
    category,
    address: item.address_name,
    roadAddress: item.road_address_name,
    latitude,
    longitude,
    distanceMeters: toDistanceMeters(item.distance),
    phoneNumber: item.phone.trim().length > 0 ? item.phone : null,
    is24Hours,
    status: resolveFallbackStatus(is24Hours),
    placeUrl: item.place_url.trim().length > 0 ? item.place_url : null,
  };
}

function createMockFacilities(
  params: FetchNearbyMedicalFacilitiesParams,
): readonly MedicalFacility[] {
  const baseFacilities: readonly MedicalFacility[] = [
    {
      id: "mock-pharmacy-1",
      name: "24시 서울약국",
      category: "pharmacy",
      address: "서울시 강남구 테헤란로 123",
      roadAddress: "서울시 강남구 테헤란로 123",
      latitude: params.latitude + 0.0012,
      longitude: params.longitude - 0.0009,
      distanceMeters: 250,
      phoneNumber: "02-1234-5678",
      is24Hours: true,
      status: "open",
      placeUrl: null,
    },
    {
      id: "mock-emergency-1",
      name: "강남세브란스병원 응급실",
      category: "emergency",
      address: "서울시 강남구 언주로 211",
      roadAddress: "서울시 강남구 언주로 211",
      latitude: params.latitude + 0.0031,
      longitude: params.longitude + 0.001,
      distanceMeters: 1_200,
      phoneNumber: "02-2019-2114",
      is24Hours: true,
      status: "open",
      placeUrl: null,
    },
    {
      id: "mock-pharmacy-2",
      name: "온누리약국",
      category: "pharmacy",
      address: "서울시 강남구 역삼동 456",
      roadAddress: "서울시 강남구 역삼동 456",
      latitude: params.latitude - 0.0013,
      longitude: params.longitude + 0.0012,
      distanceMeters: 450,
      phoneNumber: "02-6789-1000",
      is24Hours: false,
      status: "open",
      placeUrl: null,
    },
    {
      id: "mock-emergency-2",
      name: "삼성서울병원 응급의료센터",
      category: "emergency",
      address: "서울시 강남구 일원로 81",
      roadAddress: "서울시 강남구 일원로 81",
      latitude: params.latitude + 0.0053,
      longitude: params.longitude + 0.0023,
      distanceMeters: 2_100,
      phoneNumber: "02-3410-2114",
      is24Hours: true,
      status: "open",
      placeUrl: null,
    },
    {
      id: "mock-pharmacy-3",
      name: "중앙약국",
      category: "pharmacy",
      address: "서울시 강남구 선릉로 234",
      roadAddress: "서울시 강남구 선릉로 234",
      latitude: params.latitude - 0.0021,
      longitude: params.longitude - 0.0014,
      distanceMeters: 680,
      phoneNumber: null,
      is24Hours: false,
      status: "closed",
      placeUrl: null,
    },
  ];

  return baseFacilities.filter((facility) => {
    if (params.category !== "all" && facility.category !== params.category) {
      return false;
    }
    const keyword = params.keyword.trim();
    if (keyword.length === 0) {
      return true;
    }
    return facility.name.includes(keyword) || facility.roadAddress.includes(keyword);
  });
}

async function fetchKakaoLocalDocuments(
  request: KakaoSearchRequest,
  params: FetchNearbyMedicalFacilitiesParams,
): Promise<readonly KakaoLocalSearchDocument[]> {
  const restApiKey = getKakaoRestApiKey();
  const searchParams = new URLSearchParams({
    x: String(params.longitude),
    y: String(params.latitude),
    radius: String(KAKAO_SEARCH_RADIUS_METERS),
    sort: "distance",
    size: String(KAKAO_DEFAULT_SIZE),
    page: "1",
  });

  const baseUrl =
    request.kind === "category" ? KAKAO_CATEGORY_SEARCH_URL : KAKAO_KEYWORD_SEARCH_URL;

  if (request.kind === "category" && request.categoryGroupCode) {
    searchParams.set("category_group_code", request.categoryGroupCode);
  } else if (request.kind === "keyword" && request.query) {
    searchParams.set("query", request.query);
    if (request.categoryGroupCode) {
      searchParams.set("category_group_code", request.categoryGroupCode);
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, KAKAO_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}?${searchParams.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `KakaoAK ${restApiKey}`,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Kakao local search failed with status ${response.status}`);
    }

    const body = (await response.json()) as KakaoLocalSearchResponse;
    return body.documents;
  } finally {
    clearTimeout(timeout);
  }
}

function deduplicateFacilities(facilities: readonly MedicalFacility[]): readonly MedicalFacility[] {
  const deduplicatedByName = new Map<string, MedicalFacility>();

  for (const facility of facilities) {
    const key = `${facility.name}-${facility.roadAddress}`;
    const previous = deduplicatedByName.get(key);
    if (!previous || facility.distanceMeters < previous.distanceMeters) {
      deduplicatedByName.set(key, facility);
    }
  }

  return [...deduplicatedByName.values()].sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export async function fetchNearbyMedicalFacilities(
  params: FetchNearbyMedicalFacilitiesParams,
): Promise<NearbyMedicalFacilitiesResponse> {
  const restApiKey = getKakaoRestApiKey();
  if (restApiKey.length === 0) {
    return {
      source: "mock",
      facilities: createMockFacilities(params),
    };
  }

  const requests = resolveSearchRequests(params.category, params.keyword);

  try {
    const results = await Promise.all(
      requests.map(async (request, index) => {
        const documents = await fetchKakaoLocalDocuments(request, params);
        return documents.map((document, documentIndex) =>
          toMedicalFacility(
            document,
            index * KAKAO_DEFAULT_SIZE + documentIndex,
            params,
            request.fallbackCategory,
          ),
        );
      }),
    );

    const facilities = deduplicateFacilities(results.flat());
    if (facilities.length === 0) {
      return {
        source: "mock",
        facilities: createMockFacilities(params),
      };
    }

    return {
      source: "kakao",
      facilities,
    };
  } catch {
    return {
      source: "mock",
      facilities: createMockFacilities(params),
    };
  }
}
