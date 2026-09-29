import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { DrugSearchItem } from "@/api/types";
import { useDrugSearch } from "@/hooks/useDrugSearch";

const mockUseSearchDrugsQuery = jest.fn();
const mockFetchNextPage = jest.fn();

interface MockSearchDrugsQueryResult {
  readonly items: readonly DrugSearchItem[];
  readonly isFetching: boolean;
  readonly isFetchingNextPage: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly hasNextPage: boolean;
  readonly fetchNextPage: jest.Mock;
}

jest.mock("@/api/queries/drugs", () => ({
  useSearchDrugsQuery: (...args: unknown[]) => mockUseSearchDrugsQuery(...args),
}));

const drug: DrugSearchItem = {
  drugCode: "D01",
  atcCode: "N02BE01",
  drugName: "타이레놀정",
  company: "한국얀센",
};

function setQueryResult(overrides: Partial<MockSearchDrugsQueryResult> = {}) {
  const result: MockSearchDrugsQueryResult = {
    items: [drug],
    isFetching: false,
    isFetchingNextPage: false,
    isError: false,
    error: null,
    hasNextPage: false,
    fetchNextPage: mockFetchNextPage,
    ...overrides,
  };
  mockUseSearchDrugsQuery.mockReturnValue(result);
}

describe("useDrugSearch", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    setQueryResult();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("최소 길이 미만이면 debounce 후에도 검색을 비활성화한다", () => {
    renderHook(() => useDrugSearch({ keyword: "타" }));
    act(() => jest.advanceTimersByTime(250));

    expect(mockUseSearchDrugsQuery).toHaveBeenLastCalledWith("타", false);
  });

  it("debounce 후 최소 길이를 만족하면 검색을 활성화한다", () => {
    const { result } = renderHook(() => useDrugSearch({ keyword: "타이" }));
    act(() => jest.advanceTimersByTime(250));

    expect(mockUseSearchDrugsQuery).toHaveBeenLastCalledWith("타이", true);
    expect(result.current.isSearchEnabled).toBe(true);
    expect(result.current.items).toEqual([drug]);
  });

  it("excludeNames 에 포함된 약물명은 결과에서 제외한다", () => {
    const { result } = renderHook(() =>
      useDrugSearch({ keyword: "타이", excludeNames: ["타이레놀정"] }),
    );
    act(() => jest.advanceTimersByTime(250));

    expect(result.current.items).toEqual([]);
  });

  it("현재 페이지 결과가 모두 제외됐고 다음 페이지가 있으면 자동으로 추가 조회한다", async () => {
    setQueryResult({ hasNextPage: true, isFetchingNextPage: false });

    renderHook(() => useDrugSearch({ keyword: "타이", excludeNames: ["타이레놀정"] }));
    act(() => jest.advanceTimersByTime(250));

    await waitFor(() => {
      expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
    });
  });

  it("loadMore 는 다음 페이지가 있고 로딩 중이 아닐 때만 호출한다", () => {
    setQueryResult({ hasNextPage: true, isFetchingNextPage: false });
    const { result } = renderHook(() => useDrugSearch({ keyword: "타이" }));
    act(() => jest.advanceTimersByTime(250));

    act(() => result.current.loadMore());
    expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("loadMore 는 이미 다음 페이지를 불러오는 중이면 호출하지 않는다", () => {
    setQueryResult({ hasNextPage: true, isFetchingNextPage: true });
    const { result } = renderHook(() => useDrugSearch({ keyword: "타이" }));
    act(() => jest.advanceTimersByTime(250));

    act(() => result.current.loadMore());
    expect(mockFetchNextPage).not.toHaveBeenCalled();
  });
});
