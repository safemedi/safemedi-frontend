import { renderHook } from "@testing-library/react-native";

import { useMedicationStatistics } from "@/api/queries/medications";
import {
  buildMedicationReportPeriodSummary,
  buildMedicationReportWeeklyCompliance,
  deriveMedicationReportMonthlyAchievements,
  getMedicationReportMonthRange,
  getMedicationReportWeekRange,
} from "../medicationReportStatistics";
import { useMedicationStatisticsViewModel } from "../useMedicationStatisticsViewModel";

describe("medicationReportStatistics", () => {
  it("현재 주의 월요일부터 오늘까지 범위를 계산한다", () => {
    expect(getMedicationReportWeekRange(new Date("2026-04-08T00:00:00"))).toEqual({
      startDate: "2026-04-06",
      endDate: "2026-04-08",
      weekStart: new Date("2026-04-06T00:00:00"),
    });
  });

  it("월간 통계 조회 범위를 계산한다", () => {
    expect(getMedicationReportMonthRange(new Date("2026-04-08T00:00:00"))).toEqual({
      startDate: "2026-04-01",
      endDate: "2026-04-08",
    });
  });

  it("주간 복약 이행률 행을 요일 순서와 fraction으로 변환한다", () => {
    const weekRange = getMedicationReportWeekRange(new Date("2026-04-08T00:00:00"));

    const rows = buildMedicationReportWeeklyCompliance(
      [
        { date: "2026-04-06", takenCount: 17, totalCount: 20, fraction: "17/20" },
        { date: "2026-04-07", takenCount: 9, totalCount: 10, fraction: "9/10" },
      ],
      weekRange.weekStart,
      new Date("2026-04-08T00:00:00"),
    );

    expect(rows[0]).toEqual({
      dayLabel: "월요일",
      rate: 85,
      fraction: "17/20",
      tone: "warning",
    });
    expect(rows[1]).toEqual({
      dayLabel: "화요일",
      rate: 90,
      fraction: "9/10",
      tone: "success",
    });
    expect(rows[2]).toEqual({
      dayLabel: "수요일",
      rate: 0,
      fraction: "0/0",
      tone: "warning",
    });
    expect(rows[3]).toEqual({
      dayLabel: "목요일",
      rate: null,
      fraction: null,
      tone: "future",
    });
  });

  it("통계 API 응답으로 기간 요약과 성과 메시지를 생성한다", () => {
    const statistics = {
      startDate: "2026-04-01",
      endDate: "2026-04-08",
      totalScheduled: 74,
      totalTaken: 66,
      totalComplianceRate: 89.2,
      dailyCompliance: [
        { date: "2026-04-06", takenCount: 5, totalCount: 5, fraction: "5/5" },
        { date: "2026-04-07", takenCount: 4, totalCount: 4, fraction: "4/4" },
        { date: "2026-04-08", takenCount: 3, totalCount: 3, fraction: "3/3" },
      ],
    };

    expect(buildMedicationReportPeriodSummary(statistics, new Date("2026-04-08T00:00:00"))).toEqual(
      expect.objectContaining({
        complianceRate: 89,
        fraction: "66/74",
        perfectDaysCount: 3,
        attentionDaysCount: 0,
      }),
    );
    expect(deriveMedicationReportMonthlyAchievements(statistics)).toEqual([
      "이번 달 평균 이행률 목표(80%) 초과",
      "연속 3일 완벽한 복약 달성!",
    ]);
  });

  it("기간 요약의 완벽한 날은 100% 달성일만 집계한다", () => {
    const statistics = {
      startDate: "2026-04-01",
      endDate: "2026-04-02",
      totalScheduled: 11,
      totalTaken: 10,
      totalComplianceRate: 90.9,
      dailyCompliance: [
        { date: "2026-04-01", takenCount: 9, totalCount: 10, fraction: "9/10" },
        { date: "2026-04-02", takenCount: 1, totalCount: 1, fraction: "1/1" },
      ],
    };

    expect(buildMedicationReportPeriodSummary(statistics, new Date("2026-04-02T00:00:00"))).toEqual(
      expect.objectContaining({
        perfectDaysCount: 1,
        attentionDaysCount: 1,
      }),
    );
  });
});

const mockUseMedicationStatisticsQuery = useMedicationStatistics as jest.MockedFunction<
  typeof useMedicationStatistics
>;
const mockRefetchStatistics = jest.fn(async () => ({}));

jest.mock("@/api/queries/medications", () => ({
  useMedicationStatistics: jest.fn(),
}));

describe("useMedicationStatisticsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMedicationStatisticsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: mockRefetchStatistics,
    } as unknown as ReturnType<typeof useMedicationStatistics>);
  });

  it("통계 탭 데이터를 API 응답에서 변환한다", () => {
    mockUseMedicationStatisticsQuery.mockReturnValue({
      data: {
        startDate: "2026-04-01",
        endDate: "2026-04-08",
        totalScheduled: 74,
        totalTaken: 66,
        totalComplianceRate: 89.2,
        dailyCompliance: [
          { date: "2026-04-06", takenCount: 17, totalCount: 20, fraction: "17/20" },
          { date: "2026-04-07", takenCount: 9, totalCount: 10, fraction: "9/10" },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetchStatistics,
    } as unknown as ReturnType<typeof useMedicationStatistics>);

    const { result } = renderHook(() =>
      useMedicationStatisticsViewModel(new Date("2026-04-08T00:00:00")),
    );

    expect(result.current.weeklyCompliance[0]).toEqual({
      dayLabel: "월요일",
      rate: 85,
      fraction: "17/20",
      tone: "warning",
    });
    expect(result.current.monthlySummary).toEqual(
      expect.objectContaining({
        complianceRate: 89,
        fraction: "66/74",
      }),
    );
    expect(result.current.monthlyAchievements).toEqual(["이번 달 평균 이행률 목표(80%) 초과"]);
  });

  it("로딩과 에러 상태를 전달하고 refetch를 호출한다", async () => {
    mockUseMedicationStatisticsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: true,
      refetch: mockRefetchStatistics,
    } as unknown as ReturnType<typeof useMedicationStatistics>);

    const { result } = renderHook(() => useMedicationStatisticsViewModel());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(true);
    await result.current.refetch();
    expect(mockRefetchStatistics).toHaveBeenCalledTimes(2);
  });
});
