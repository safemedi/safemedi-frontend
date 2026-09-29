import { renderHook } from "@testing-library/react-native";

import { fetchMedicationRecords, fetchMedicationStatistics } from "@/api/endpoints/medications";
import { queryKeys } from "@/api/query-keys";
import { useMedicationDailyRecords, useMedicationStatistics } from "../medications";

const mockFetchMedicationRecords = fetchMedicationRecords as jest.MockedFunction<
  typeof fetchMedicationRecords
>;
const mockFetchMedicationStatistics = fetchMedicationStatistics as jest.MockedFunction<
  typeof fetchMedicationStatistics
>;

let mockAccessToken: string | null = "token";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn((options: unknown) => options),
}));

jest.mock("@/api/endpoints/medications", () => ({
  fetchMedicationRecords: jest.fn(async () => ({
    period: "2026-05",
    summary: { totalCount: 0, takenCount: 0, fraction: "0/0", complianceRate: 0 },
    records: [],
  })),
  fetchMedicationStatistics: jest.fn(async () => ({
    startDate: "2026-05-01",
    endDate: "2026-05-18",
    totalScheduled: 0,
    totalTaken: 0,
    totalComplianceRate: 0,
    dailyCompliance: [],
  })),
}));

jest.mock("@/stores/sessionStore", () => ({
  useSessionStore: (selector: (state: { accessToken: string | null }) => unknown) =>
    selector({ accessToken: mockAccessToken }),
}));

describe("api/queries/medications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessToken = "token";
  });

  it("일별 복약 기록 쿼리는 DAILY 타입을 전달한다", async () => {
    const { result } = renderHook(() => useMedicationDailyRecords({ date: "2026-05-18" }));
    const options = result.current as unknown as {
      enabled: boolean;
      queryKey: unknown;
      queryFn: () => Promise<unknown>;
    };

    expect(options.enabled).toBe(true);
    expect(options.queryKey).toEqual(queryKeys.medications.records("DAILY", "2026-05-18"));

    await options.queryFn();
    expect(mockFetchMedicationRecords).toHaveBeenCalledWith({
      type: "DAILY",
      date: "2026-05-18",
      familyId: undefined,
    });
  });

  it("복약 통계 쿼리는 도메인 공통 staleTime을 사용한다", async () => {
    const { result } = renderHook(() =>
      useMedicationStatistics({ startDate: "2026-05-01", endDate: "2026-05-18" }),
    );
    const options = result.current as unknown as {
      enabled: boolean;
      queryKey: unknown;
      staleTime: number;
      queryFn: () => Promise<unknown>;
    };

    expect(options.enabled).toBe(true);
    expect(options.queryKey).toEqual(queryKeys.medications.statistics("2026-05-01", "2026-05-18"));
    expect(options.staleTime).toBe(60 * 1000);

    await options.queryFn();
    expect(mockFetchMedicationStatistics).toHaveBeenCalledWith({
      startDate: "2026-05-01",
      endDate: "2026-05-18",
    });
  });
});
