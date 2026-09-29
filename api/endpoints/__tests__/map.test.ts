import { apiPaths } from "@/api/paths";
import { fetchNearbyMedicalFacilities } from "../map";

const mockApiGet = jest.fn();

jest.mock("@/api/client", () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
  },
}));

describe("api/endpoints/map", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("좌표·카테고리·키워드를 쿼리 파라미터로 담아 프록시 엔드포인트를 호출한다", async () => {
    const expected = {
      source: "kakao",
      facilities: [
        {
          id: "pharmacy-온누리약국-0-37.497821-127.027102",
          name: "온누리약국",
          category: "pharmacy",
          address: "서울 강남구 역삼동 123-45",
          roadAddress: "서울 강남구 테헤란로 123",
          latitude: 37.497821,
          longitude: 127.027102,
          distanceMeters: 180,
          phoneNumber: "02-1234-5678",
          is24Hours: false,
          status: "unknown",
          placeUrl: "http://place.map.kakao.com/123456",
        },
      ],
    };
    const mockJson = jest.fn(async () => expected);
    mockApiGet.mockReturnValueOnce({ json: mockJson });

    const result = await fetchNearbyMedicalFacilities({
      latitude: 37.497941,
      longitude: 127.027618,
      category: "all",
      keyword: "강남",
    });

    expect(mockApiGet).toHaveBeenCalledWith(apiPaths.mapFacilities, {
      searchParams: {
        latitude: 37.497941,
        longitude: 127.027618,
        category: "all",
        keyword: "강남",
      },
    });
    expect(result).toEqual(expected);
  });

  it("백엔드 요청이 실패하면 mock으로 대체하지 않고 에러를 그대로 전파한다", async () => {
    const error = new Error("VAL_020");
    mockApiGet.mockReturnValueOnce({
      json: jest.fn(async () => {
        throw error;
      }),
    });

    await expect(
      fetchNearbyMedicalFacilities({
        latitude: 999,
        longitude: 127.027618,
        category: "all",
        keyword: "",
      }),
    ).rejects.toThrow(error);
  });
});
