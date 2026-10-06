import { renderHook } from "@testing-library/react-native";
import { queryKeys } from "@/api/query-keys";
import type { TodayMedicationSchedulesResponse } from "@/api/types/dashboard";
import {
  useDashboardTodayMedicationSchedules,
  useFamilyTodayMedicationSchedules,
  useMarkMedicationRecordsMutation,
} from "../dashboard";

const mockFetchTodayMedicationSchedules = jest.fn<Promise<unknown>, [number?]>(async () => ({}));
const mockUpdateMedicationRecords = jest.fn<Promise<unknown>, [unknown]>(async () => ({}));
const mockCancelQueries = jest.fn(async () => undefined);
const mockInvalidateQueries = jest.fn(async () => undefined);
const mockGetQueryData = jest.fn<TodayMedicationSchedulesResponse | undefined, [unknown]>(
  () => undefined,
);
const mockSetQueryData = jest.fn<void, [unknown, unknown]>();

let mockAccessToken: string | null = "token";

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn((options: unknown) => options),
  useQuery: jest.fn((options: unknown) => options),
  useQueryClient: jest.fn(() => ({
    cancelQueries: mockCancelQueries,
    getQueryData: mockGetQueryData,
    invalidateQueries: mockInvalidateQueries,
    setQueryData: mockSetQueryData,
  })),
}));

jest.mock("@/api/endpoints/dashboard", () => ({
  fetchTodayMedicationSchedules: (familyId?: number) => mockFetchTodayMedicationSchedules(familyId),
  updateMedicationRecords: (body: unknown) => mockUpdateMedicationRecords(body),
}));

jest.mock("@/stores/sessionStore", () => ({
  useSessionStore: (selector: (state: { accessToken: string | null }) => unknown) =>
    selector({ accessToken: mockAccessToken }),
}));

const todaySchedulesData: TodayMedicationSchedulesResponse = {
  date: "2026-05-19",
  summary: { totalCount: 2, completedCount: 0, completionRate: 0 },
  schedules: [
    {
      takeTime: "08:00",
      prescriptionId: 1,
      prescriptionTitle: "아침약",
      drugCount: 1,
      recordIds: [1],
      displayStatus: "NEED_TAKE",
    },
    {
      takeTime: "08:00",
      prescriptionId: 1,
      prescriptionTitle: "아침약",
      drugCount: 1,
      recordIds: [2],
      displayStatus: "NEED_TAKE",
    },
  ],
};

describe("api/queries/dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessToken = "token";
    mockGetQueryData.mockReturnValue(todaySchedulesData);
  });

  it("오늘 스케줄 쿼리는 today 엔드포인트 요청 함수를 사용한다", async () => {
    const { result } = renderHook(() => useDashboardTodayMedicationSchedules());
    const options = result.current as unknown as {
      enabled: boolean;
      queryKey: unknown;
      queryFn: () => Promise<unknown>;
    };

    expect(options.enabled).toBe(true);
    expect(options.queryKey).toEqual(queryKeys.dashboard.todayMedicationSchedules);
    await options.queryFn();
    expect(mockFetchTodayMedicationSchedules).toHaveBeenCalledTimes(1);
  });

  it("가족별 캐시를 분리하고 선택한 가족 ID를 전달한다", async () => {
    const { result } = renderHook(() => useFamilyTodayMedicationSchedules(12));
    const options = result.current as unknown as {
      enabled: boolean;
      queryKey: unknown;
      queryFn: () => Promise<unknown>;
    };
    expect(options.enabled).toBe(true);
    expect(options.queryKey).toEqual(queryKeys.family.todayMedicationSchedules(12));
    expect(options.queryKey).not.toEqual(queryKeys.family.todayMedicationSchedules(13));
    expect(options.queryKey).not.toEqual(queryKeys.dashboard.todayMedicationSchedules);
    await options.queryFn();
    expect(mockFetchTodayMedicationSchedules).toHaveBeenCalledWith(12);
  });

  it.each([
    undefined,
    0,
    -1,
    NaN,
    1.5,
  ])("유효하지 않은 가족 ID %s로는 조회하지 않는다", (familyId) => {
    const { result } = renderHook(() => useFamilyTodayMedicationSchedules(familyId));
    const options = result.current as unknown as {
      enabled: boolean;
      queryFn: () => Promise<unknown>;
    };
    expect(options.enabled).toBe(false);
    expect(() => options.queryFn()).toThrow("유효하지 않은 가족 ID");
    expect(mockFetchTodayMedicationSchedules).not.toHaveBeenCalled();
  });

  it("로그인하지 않으면 가족 스케줄을 조회하지 않는다", () => {
    mockAccessToken = null;
    const { result } = renderHook(() => useFamilyTodayMedicationSchedules(12));
    expect((result.current as unknown as { enabled: boolean }).enabled).toBe(false);
  });

  it("복수 recordId mutation은 하나의 요청으로 처리하고 onMutate에서 일괄 낙관적 업데이트한다", async () => {
    mockUpdateMedicationRecords.mockResolvedValueOnce({
      recordIds: [1, 2],
      status: "SUCCESS",
    });

    const { result } = renderHook(() => useMarkMedicationRecordsMutation());
    const mutation = result.current as unknown as {
      mutationFn: (params: { recordIds: readonly number[]; status: "SUCCESS" }) => Promise<unknown>;
      onMutate: (params: {
        recordIds: readonly number[];
        status: "SUCCESS";
      }) => Promise<{ previousData: TodayMedicationSchedulesResponse | undefined }>;
      onSettled: () => Promise<void>;
    };

    await mutation.mutationFn({ recordIds: [1, 2], status: "SUCCESS" });
    expect(mockUpdateMedicationRecords).toHaveBeenCalledWith({
      recordIds: [1, 2],
      status: "SUCCESS",
    });

    await mutation.onMutate({ recordIds: [1, 2], status: "SUCCESS" });
    expect(mockSetQueryData).toHaveBeenCalledWith(
      queryKeys.dashboard.todayMedicationSchedules,
      expect.objectContaining({
        summary: expect.objectContaining({ completedCount: 2 }),
      }),
    );

    await mutation.onSettled();
    expect(mockInvalidateQueries).toHaveBeenNthCalledWith(1, {
      queryKey: queryKeys.dashboard.todayMedicationSchedules,
    });
    expect(mockInvalidateQueries).toHaveBeenNthCalledWith(2, {
      queryKey: queryKeys.medications.all,
    });
  });

  it("mutation이 실패하면 onError에서 낙관적 업데이트를 롤백한다", async () => {
    mockUpdateMedicationRecords.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useMarkMedicationRecordsMutation());
    const mutation = result.current as unknown as {
      mutationFn: (params: { recordIds: readonly number[]; status: "SUCCESS" }) => Promise<unknown>;
      onMutate: (params: {
        recordIds: readonly number[];
        status: "SUCCESS";
      }) => Promise<{ previousData: TodayMedicationSchedulesResponse | undefined }>;
      onError: (
        error: unknown,
        params: { recordIds: readonly number[]; status: "SUCCESS" },
        context: { previousData: TodayMedicationSchedulesResponse | undefined },
      ) => void;
    };

    const context = await mutation.onMutate({ recordIds: [1, 2], status: "SUCCESS" });

    await expect(mutation.mutationFn({ recordIds: [1, 2], status: "SUCCESS" })).rejects.toThrow(
      "network error",
    );

    mutation.onError(new Error("network error"), { recordIds: [1, 2], status: "SUCCESS" }, context);
    expect(mockSetQueryData).toHaveBeenLastCalledWith(
      queryKeys.dashboard.todayMedicationSchedules,
      todaySchedulesData,
    );
  });
});
