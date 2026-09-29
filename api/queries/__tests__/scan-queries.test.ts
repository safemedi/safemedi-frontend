import { renderHook } from "@testing-library/react-native";
import { queryKeys } from "@/api/query-keys";
import { useSearchDrugsQuery } from "../drugs";
import { useCreatePrescriptionByScanMutation } from "../prescription-scan";

const mockSearchDrugs = jest.fn<Promise<unknown>, [unknown]>(async () => ({
  content: [],
  page: 0,
  size: 10,
  isLast: true,
}));
const mockCreatePrescriptionByScan = jest.fn<Promise<unknown>, [unknown]>(async () => ({}));
const mockUseInfiniteQuery = jest.fn();
const mockInvalidateQueries = jest.fn(async () => undefined);

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: (options: unknown) => mockUseInfiniteQuery(options),
  useMutation: jest.fn((options: unknown) => options),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
}));

jest.mock("@/api/endpoints/drugs", () => ({
  DRUG_SEARCH_PAGE_SIZE: 10,
  searchDrugs: (params: unknown) => mockSearchDrugs(params),
}));

jest.mock("@/api/endpoints/prescription-scan", () => ({
  createPrescriptionByScan: (body: unknown) => mockCreatePrescriptionByScan(body),
}));

describe("api/queries scan modules", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("drug 검색 무한 쿼리 옵션과 파생 결과를 올바르게 구성한다", async () => {
    const drugItem = { drugCode: "D01", atcCode: "A", drugName: "타이레놀", company: "한국얀센" };
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [{ content: [drugItem], page: 0, size: 10, isLast: false }] },
      isFetching: false,
      isFetchingNextPage: false,
      isError: false,
      error: null,
      hasNextPage: true,
      fetchNextPage: jest.fn(),
    });

    const { result } = renderHook(() => useSearchDrugsQuery("타이", true));

    const options = mockUseInfiniteQuery.mock.calls[0][0] as {
      queryKey: unknown;
      enabled: boolean;
      staleTime: number;
      initialPageParam: number;
      queryFn: (context: { pageParam: number }) => Promise<unknown>;
      getNextPageParam: (page: { page: number; isLast: boolean }) => number | undefined;
    };

    expect(options.queryKey).toEqual(queryKeys.scan.searchDrugs("타이"));
    expect(options.enabled).toBe(true);
    expect(options.staleTime).toBe(60_000);
    expect(options.initialPageParam).toBe(0);
    expect(options.getNextPageParam({ page: 0, isLast: false })).toBe(1);
    expect(options.getNextPageParam({ page: 0, isLast: true })).toBeUndefined();

    await options.queryFn({ pageParam: 0 });
    expect(mockSearchDrugs).toHaveBeenCalledWith({ keyword: "타이", page: 0, size: 10 });

    expect(result.current.items).toEqual([drugItem]);
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("처방전 생성 mutation 옵션을 올바르게 구성한다", async () => {
    const { result } = renderHook(() => useCreatePrescriptionByScanMutation());
    const mutation = result.current as unknown as {
      mutationKey: unknown;
      mutationFn: (body: unknown) => Promise<unknown>;
      onSuccess: () => Promise<void>;
    };

    expect(mutation.mutationKey).toEqual(queryKeys.scan.createPrescription);
    await mutation.mutationFn({ title: "처방전" });
    expect(mockCreatePrescriptionByScan).toHaveBeenCalledWith({ title: "처방전" });
  });

  it("처방전 생성 성공 시 대시보드 관련 쿼리를 무효화한다", async () => {
    const { result } = renderHook(() => useCreatePrescriptionByScanMutation());
    const mutation = result.current as unknown as {
      onSuccess: () => Promise<void>;
    };

    await mutation.onSuccess();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.prescriptions.list });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.dashboard.todayMedicationSchedules,
    });
  });
});
