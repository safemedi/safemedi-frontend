import { renderHook } from "@testing-library/react-native";
import { queryKeys } from "@/api/query-keys";
import { useNearbyMedicalFacilitiesQuery } from "../map";

const mockFetchNearbyMedicalFacilities = jest.fn<Promise<unknown>, [unknown]>(async () => ({}));
let mockAccessToken: string | null = "token";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn((options: unknown) => options),
}));

jest.mock("@/api/endpoints/map", () => ({
  fetchNearbyMedicalFacilities: (params: unknown) => mockFetchNearbyMedicalFacilities(params),
}));

jest.mock("@/stores/sessionStore", () => ({
  useSessionStore: (selector: (state: { accessToken: string | null }) => unknown) =>
    selector({ accessToken: mockAccessToken }),
}));

describe("api/queries/map", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessToken = "token";
  });

  it("좌표와 토큰이 있으면 주변 시설 쿼리가 활성화된다", async () => {
    const { result } = renderHook(() =>
      useNearbyMedicalFacilitiesQuery({
        latitude: 37.5665,
        longitude: 126.978,
        category: "all",
        keyword: "강남",
      }),
    );
    const options = result.current as unknown as {
      enabled: boolean;
      queryKey: unknown;
      queryFn: () => Promise<unknown>;
    };

    expect(options.enabled).toBe(true);
    expect(options.queryKey).toEqual(
      queryKeys.map.nearbyFacilities(37.5665, 126.978, "all", "강남"),
    );
    await options.queryFn();
    expect(mockFetchNearbyMedicalFacilities).toHaveBeenCalledWith({
      latitude: 37.5665,
      longitude: 126.978,
      category: "all",
      keyword: "강남",
    });
  });

  it("토큰이 없으면 비활성화된다", () => {
    mockAccessToken = null;
    const { result } = renderHook(() =>
      useNearbyMedicalFacilitiesQuery({
        latitude: 37.5665,
        longitude: 126.978,
        category: "pharmacy",
        keyword: "",
      }),
    );
    const options = result.current as unknown as { enabled: boolean };

    expect(options.enabled).toBe(false);
  });

  it("좌표가 없으면 비활성화되고 기본 좌표 키를 사용한다", () => {
    const { result } = renderHook(() =>
      useNearbyMedicalFacilitiesQuery({
        latitude: null,
        longitude: null,
        category: "emergency",
        keyword: "",
      }),
    );
    const options = result.current as unknown as {
      enabled: boolean;
      queryKey: unknown;
    };

    expect(options.enabled).toBe(false);
    expect(options.queryKey).toEqual(queryKeys.map.nearbyFacilities(0, 0, "emergency", ""));
  });
});
