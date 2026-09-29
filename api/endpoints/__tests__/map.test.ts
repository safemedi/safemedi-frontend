import { fetchNearbyMedicalFacilities } from "../map";

const originalRestApiKey = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
const globalFetch = global.fetch;

describe("api/endpoints/map", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (originalRestApiKey === undefined) {
      delete process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
    } else {
      process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY = originalRestApiKey;
    }
    global.fetch = globalFetch;
  });

  it("카카오 REST API 키가 없으면 mock 데이터를 반환한다", async () => {
    process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY = "";

    const result = await fetchNearbyMedicalFacilities({
      latitude: 37.5665,
      longitude: 126.978,
      category: "all",
      keyword: "",
    });

    expect(result.source).toBe("mock");
    expect(result.facilities.length).toBeGreaterThan(0);
  });

  it("카카오 응답이 정상이면 시설 목록을 가공해 반환한다", async () => {
    process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY = "rest-api-key";

    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          documents: [
            {
              place_name: "강남약국",
              category_name: "의료,건강 > 약국",
              address_name: "서울시 강남구 역삼동",
              road_address_name: "서울시 강남구 테헤란로 1",
              x: "127.01",
              y: "37.5",
              phone: "02-1111-1111",
              distance: "120",
              place_url: "https://place.map.kakao.com/1",
            },
            {
              place_name: "중복시설",
              category_name: "의료,건강 > 약국",
              address_name: "서울시 강남구 역삼동",
              road_address_name: "서울시 강남구 테헤란로 2",
              x: "127.02",
              y: "37.52",
              phone: "",
              distance: "80",
              place_url: "",
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          documents: [
            {
              place_name: "중복시설",
              category_name: "의료,건강 > 병원",
              address_name: "서울시 강남구 역삼동",
              road_address_name: "서울시 강남구 테헤란로 2",
              x: "127.03",
              y: "37.53",
              phone: "02-2222-2222",
              distance: "200",
              place_url: "https://place.map.kakao.com/2",
            },
            {
              place_name: "강남응급센터",
              category_name: "의료,건강 > 병원",
              address_name: "서울시 강남구 삼성동",
              road_address_name: "서울시 강남구 봉은사로 3",
              x: "invalid",
              y: "invalid",
              phone: "02-3333-3333",
              distance: "900",
              place_url: "https://place.map.kakao.com/3",
            },
          ],
        }),
      });

    global.fetch = mockFetch as unknown as typeof fetch;

    const result = await fetchNearbyMedicalFacilities({
      latitude: 37.5,
      longitude: 127.01,
      category: "all",
      keyword: "강남",
    });

    expect(result.source).toBe("kakao");
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toContain("search/keyword.json");
    expect(mockFetch.mock.calls[0][0]).toContain("query=%EA%B0%95%EB%82%A8+%EC%95%BD%EA%B5%AD");
    expect(mockFetch.mock.calls[1][0]).toContain(
      "query=%EA%B0%95%EB%82%A8+%EC%9D%91%EA%B8%89%EC%8B%A4",
    );

    const facilityNames = result.facilities.map((facility) => facility.name);
    expect(facilityNames).toContain("강남약국");
    expect(facilityNames).toContain("강남응급센터");
    expect(result.facilities.filter((facility) => facility.name === "중복시설")).toHaveLength(1);

    const emergencyFacility = result.facilities.find(
      (facility) => facility.name === "강남응급센터",
    );
    expect(emergencyFacility).toEqual(
      expect.objectContaining({
        category: "emergency",
        latitude: 37.5,
        longitude: 127.01,
        placeUrl: "https://place.map.kakao.com/3",
      }),
    );

    const duplicatedFacility = result.facilities.find((facility) => facility.name === "중복시설");
    expect(duplicatedFacility?.phoneNumber).toBe(null);
  });

  it("카카오 응답이 비정상이면 mock 데이터로 fallback 한다", async () => {
    process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY = "rest-api-key";
    const mockFetch = jest.fn(async () => ({ ok: false, status: 500 }));
    global.fetch = mockFetch as unknown as typeof fetch;

    const result = await fetchNearbyMedicalFacilities({
      latitude: 37.5665,
      longitude: 126.978,
      category: "pharmacy",
      keyword: "",
    });

    expect(result.source).toBe("mock");
    expect(result.facilities.every((facility) => facility.category === "pharmacy")).toBe(true);
  });

  it("emergency 단일 검색에서는 fallback 카테고리를 emergency로 유지한다", async () => {
    process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY = "rest-api-key";

    const mockFetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        documents: [
          {
            place_name: "야간진료센터",
            category_name: "생활,편의",
            address_name: "서울시 강남구 역삼동",
            road_address_name: "서울시 강남구 테헤란로 10",
            x: "127.02",
            y: "37.52",
            phone: "02-0000-0000",
            distance: "300",
            place_url: "",
          },
        ],
      }),
    }));
    global.fetch = mockFetch as unknown as typeof fetch;

    const result = await fetchNearbyMedicalFacilities({
      latitude: 37.5,
      longitude: 127.01,
      category: "emergency",
      keyword: "야간",
    });

    expect(result.source).toBe("kakao");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.facilities[0]?.category).toBe("emergency");
  });

  it("카카오 결과가 비어있으면 mock 데이터를 반환한다", async () => {
    process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY = "rest-api-key";
    const mockFetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ documents: [] }),
    }));
    global.fetch = mockFetch as unknown as typeof fetch;

    const result = await fetchNearbyMedicalFacilities({
      latitude: 37.5665,
      longitude: 126.978,
      category: "emergency",
      keyword: "",
    });

    expect(result.source).toBe("mock");
    expect(result.facilities.every((facility) => facility.category === "emergency")).toBe(true);
  });
});
