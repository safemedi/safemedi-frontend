import { apiPaths } from "@/api/paths";
import { searchDiseases, searchDrugAllergies } from "../health-profile";

const mockApiGet = jest.fn();

jest.mock("@/api/client", () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
  },
}));

jest.mock("@/constants/api-config", () => ({
  apiConfig: { useMock: false },
}));

type MockApiConfig = {
  useMock: boolean;
};

function setMockMode(useMock: boolean) {
  const { apiConfig } = require("@/constants/api-config") as { apiConfig: MockApiConfig };
  apiConfig.useMock = useMock;
}

describe("api/endpoints/health-profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setMockMode(false);
  });

  it("알러지 검색은 1글자 미만이면 API 호출 없이 빈 페이지를 반환한다", async () => {
    const result = await searchDrugAllergies({ keyword: "" });

    expect(result).toEqual({ content: [], page: 0, size: 10, isLast: true });
    expect(mockApiGet).not.toHaveBeenCalled();
  });

  it("알러지 검색은 새 알러지 검색 API를 호출한다", async () => {
    const expected = {
      content: [{ allergyType: "ATC_GROUP", allergyValue: "J01C", allergyName: "페니실린류" }],
      page: 0,
      size: 10,
      isLast: true,
    };
    mockApiGet.mockReturnValueOnce({
      json: jest.fn(async () => expected),
    });

    const result = await searchDrugAllergies({ keyword: " 페 " });

    expect(mockApiGet).toHaveBeenCalledWith(apiPaths.drugAllergiesSearch, {
      searchParams: { keyword: "페", page: "0", size: "10" },
    });
    expect(result).toEqual(expected);
  });

  it("기저질환 검색은 2글자 미만이면 API 호출 없이 빈 페이지를 반환한다", async () => {
    const result = await searchDiseases({ keyword: "고" });

    expect(result).toEqual({ content: [], page: 0, size: 10, isLast: true });
    expect(mockApiGet).not.toHaveBeenCalled();
  });

  it("기저질환 검색은 질환 검색 API를 호출한다", async () => {
    const expected = {
      content: [{ diseaseCode: "I10", diseaseName: "본태성(원발성) 고혈압" }],
      page: 1,
      size: 5,
      isLast: true,
    };
    mockApiGet.mockReturnValueOnce({
      json: jest.fn(async () => expected),
    });

    const result = await searchDiseases({ keyword: " 고혈압 ", page: 1, size: 5 });

    expect(mockApiGet).toHaveBeenCalledWith(apiPaths.diseasesSearch, {
      searchParams: { keyword: "고혈압", page: "1", size: "5" },
    });
    expect(result).toEqual(expected);
  });

  it("mock 모드에서 API 실패 시 fallback mock을 반환한다", async () => {
    setMockMode(true);
    mockApiGet.mockImplementation(() => {
      throw new Error("network");
    });

    await expect(searchDrugAllergies({ keyword: "진통" })).resolves.toMatchObject({
      content: expect.arrayContaining([expect.objectContaining({ allergyValue: "N02" })]),
    });
    await expect(searchDiseases({ keyword: "고혈압" })).resolves.toMatchObject({
      content: expect.arrayContaining([expect.objectContaining({ diseaseCode: "I10" })]),
    });
  });
});
