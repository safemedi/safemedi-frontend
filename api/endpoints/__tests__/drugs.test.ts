import { apiPaths } from "@/api/paths";
import { searchDrugs } from "../drugs";

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

describe("api/endpoints/drugs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setMockMode(false);
  });

  it("검색어가 2글자 미만이면 API 호출 없이 빈 페이지를 반환한다", async () => {
    const result = await searchDrugs({ keyword: "a" });

    expect(result).toEqual({ content: [], page: 0, size: 10, isLast: true });
    expect(mockApiGet).not.toHaveBeenCalled();
  });

  it("정상 검색 시 page/size 쿼리로 페이지 응답을 반환한다", async () => {
    const expected = {
      content: [{ drugCode: "D01", atcCode: "A", drugName: "타이레놀", company: "한국얀센" }],
      page: 0,
      size: 10,
      isLast: true,
    };
    mockApiGet.mockReturnValueOnce({
      json: jest.fn(async () => expected),
    });

    const result = await searchDrugs({ keyword: " 타이 " });

    expect(mockApiGet).toHaveBeenCalledWith(apiPaths.drugsSearch, {
      searchParams: { keyword: "타이", page: "0", size: "10" },
    });
    expect(result).toEqual(expected);
  });

  it("page 파라미터를 전달하면 해당 페이지 쿼리를 호출한다", async () => {
    mockApiGet.mockReturnValueOnce({
      json: jest.fn(async () => ({ content: [], page: 2, size: 5, isLast: true })),
    });

    await searchDrugs({ keyword: "타이", page: 2, size: 5 });

    expect(mockApiGet).toHaveBeenCalledWith(apiPaths.drugsSearch, {
      searchParams: { keyword: "타이", page: "2", size: "5" },
    });
  });

  it("mock 모드에서 API 실패 시 fallback mock 목록을 필터링해 페이지로 반환한다", async () => {
    setMockMode(true);
    mockApiGet.mockImplementationOnce(() => {
      throw new Error("network");
    });

    const result = await searchDrugs({ keyword: "아목" });

    expect(result.content.length).toBeGreaterThan(0);
    expect(result.content.every((item) => item.drugName.includes("아목"))).toBe(true);
  });

  it("mock 모드가 아니면 API 실패를 throw 한다", async () => {
    mockApiGet.mockImplementationOnce(() => {
      throw new Error("network down");
    });

    await expect(searchDrugs({ keyword: "타이" })).rejects.toThrow("network down");
  });
});
