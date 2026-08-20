import { act, renderHook } from "@testing-library/react-native";

import { useMedicationDailyRecords, useMedicationStatistics } from "@/api/queries/medications";
import { countComplianceDayBuckets } from "../../medication-statistics/medicationReportStatistics";
import {
  buildMedicationCalendarWeeks,
  resolveDefaultSelectedDate,
  resolveDefaultSelectedDateForMonth,
  useMedicationCalendarViewModel,
} from "../useMedicationCalendarViewModel";

const mockUseMedicationStatistics = useMedicationStatistics as jest.MockedFunction<
  typeof useMedicationStatistics
>;
const mockUseMedicationDailyRecords = useMedicationDailyRecords as jest.MockedFunction<
  typeof useMedicationDailyRecords
>;
const mockRefetchStatistics = jest.fn(async () => ({}));
const mockRefetchDailyRecords = jest.fn(async () => ({}));

jest.mock("@/api/queries/medications", () => ({
  useMedicationStatistics: jest.fn(),
  useMedicationDailyRecords: jest.fn(),
}));

const mockDailyCompliance = [
  { date: "2026-04-06", takenCount: 2, totalCount: 3, fraction: "2/3" },
  { date: "2026-04-07", takenCount: 1, totalCount: 2, fraction: "1/2" },
];

const mockDailyRecords = {
  date: "2026-04-06",
  summary: {
    totalCount: 3,
    takenCount: 2,
    fraction: "2/3",
    complianceRate: 66.7,
  },
  records: [
    {
      recordIds: [499],
      prescriptionTitle: "신장내과 처방전",
      medicationNames: ["타이레놀정 500mg"],
      scheduledTime: "08:00",
      takenTime: "08:05",
      status: "SUCCESS" as const,
    },
    {
      recordIds: [500, 501],
      prescriptionTitle: "신장내과 처방전",
      medicationNames: ["오메프라졸캡슐 20mg"],
      scheduledTime: "08:00",
      takenTime: "08:10",
      status: "SUCCESS" as const,
    },
    {
      recordIds: [502],
      prescriptionTitle: "심장내과 처방전",
      medicationNames: ["암로디핀정 5mg"],
      scheduledTime: "14:00",
      takenTime: null,
      status: "PENDING" as const,
    },
  ],
};

const mockStatisticsResponse = {
  startDate: "2026-04-01",
  endDate: "2026-04-10",
  totalScheduled: 9,
  totalTaken: 8,
  totalComplianceRate: 88.9,
  dailyCompliance: mockDailyCompliance,
};

function mockQueries(options?: {
  readonly statisticsData?: typeof mockStatisticsResponse;
  readonly dailyRecordsData?: typeof mockDailyRecords;
  readonly isStatisticsLoading?: boolean;
  readonly isDailyRecordsLoading?: boolean;
  readonly isStatisticsError?: boolean;
  readonly isDailyRecordsError?: boolean;
}) {
  mockUseMedicationStatistics.mockReturnValue({
    data: options?.statisticsData,
    isLoading: options?.isStatisticsLoading ?? false,
    isFetching: options?.isStatisticsLoading ?? false,
    isError: options?.isStatisticsError ?? false,
    refetch: mockRefetchStatistics,
  } as unknown as ReturnType<typeof useMedicationStatistics>);

  mockUseMedicationDailyRecords.mockReturnValue({
    data: options?.dailyRecordsData,
    isLoading: options?.isDailyRecordsLoading ?? false,
    isFetching: options?.isDailyRecordsLoading ?? false,
    isError: options?.isDailyRecordsError ?? false,
    refetch: mockRefetchDailyRecords,
  } as unknown as ReturnType<typeof useMedicationDailyRecords>);
}

describe("useMedicationCalendarViewModel helpers", () => {
  it("통계 API dailyCompliance로 캘린더 주간 그리드를 생성한다", () => {
    const complianceByDate = new Map(mockDailyCompliance.map((entry) => [entry.date, entry]));
    const weeks = buildMedicationCalendarWeeks({
      monthDate: new Date("2026-04-01T00:00:00"),
      today: new Date("2026-04-10T00:00:00"),
      complianceByDate,
    });

    const aprilSix = weeks.flat().find((day) => day.date === "2026-04-06");
    const aprilSeven = weeks.flat().find((day) => day.date === "2026-04-07");

    expect(aprilSix).toEqual(
      expect.objectContaining({ day: 6, fraction: "2/3", rate: 67, tone: "red" }),
    );
    expect(aprilSeven).toEqual(
      expect.objectContaining({ day: 7, fraction: "1/2", rate: 50, tone: "red" }),
    );
  });

  it("완벽한 날과 주의 필요 일수를 dailyCompliance에서 계산한다", () => {
    expect(countComplianceDayBuckets(mockDailyCompliance, new Date("2026-04-10T00:00:00"))).toEqual(
      {
        perfectDaysCount: 0,
        attentionDaysCount: 2,
      },
    );
  });

  it("완료율에 따라 초록·노랑 상태와 미래 날짜를 구분한다", () => {
    const complianceByDate = new Map([
      ["2026-04-01", { date: "2026-04-01", takenCount: 2, totalCount: 2, fraction: "2/2" }],
      ["2026-04-02", { date: "2026-04-02", takenCount: 3, totalCount: 4, fraction: "3/4" }],
    ]);
    const days = buildMedicationCalendarWeeks({
      monthDate: new Date("2026-04-01T00:00:00"),
      today: new Date("2026-04-02T00:00:00"),
      complianceByDate,
    }).flat();

    expect(days.find((day) => day.date === "2026-04-01")).toEqual(
      expect.objectContaining({ tone: "green", fraction: "2/2" }),
    );
    expect(days.find((day) => day.date === "2026-04-02")).toEqual(
      expect.objectContaining({ tone: "yellow", rate: 75 }),
    );
    expect(days.find((day) => day.date === "2026-04-03")).toEqual(
      expect.objectContaining({ tone: "future", fraction: null }),
    );
  });

  it("기본 선택 날짜를 오늘 또는 최근 통계일로 결정한다", () => {
    const complianceByDate = new Map(mockDailyCompliance.map((entry) => [entry.date, entry]));

    expect(resolveDefaultSelectedDate(complianceByDate, new Date("2026-04-06T00:00:00"))).toBe(
      "2026-04-06",
    );
    expect(resolveDefaultSelectedDate(complianceByDate, new Date("2026-04-08T00:00:00"))).toBe(
      "2026-04-07",
    );
    expect(resolveDefaultSelectedDate(new Map(), new Date("2026-04-08T00:00:00"))).toBe(
      "2026-04-08",
    );
  });

  it("과거 월의 기본 선택 날짜를 해당 월 마지막 기록일로 결정한다", () => {
    const complianceByDate = new Map(mockDailyCompliance.map((entry) => [entry.date, entry]));

    expect(
      resolveDefaultSelectedDateForMonth(
        complianceByDate,
        new Date("2026-04-01T00:00:00"),
        new Date("2026-04-10T00:00:00"),
      ),
    ).toBe("2026-04-07");

    expect(
      resolveDefaultSelectedDateForMonth(
        new Map(),
        new Date("2026-03-01T00:00:00"),
        new Date("2026-04-10T00:00:00"),
      ),
    ).toBe("2026-03-31");
  });
});

describe("useMedicationCalendarViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueries();
  });

  it("통계 API와 일별 기록 API를 조합해 캘린더 화면 모델로 변환한다", () => {
    mockQueries({
      statisticsData: mockStatisticsResponse,
      dailyRecordsData: mockDailyRecords,
    });

    const { result } = renderHook(() =>
      useMedicationCalendarViewModel(new Date("2026-04-06T00:00:00")),
    );

    expect(result.current.periodSummary.complianceRate).toBe(89);
    expect(result.current.periodSummary.attentionDaysCount).toBe(1);
    expect(result.current.monthLabel).toBe("2026년 4월");
    expect(result.current.canGoToNextMonth).toBe(false);
    expect(result.current.selectedDate).toBe("2026-04-06");
    expect(result.current.selectedDateTitle).toBe("2026-04-06 복약 기록");
    expect(result.current.selectedDaySummary).toBe("2/3 완료 (67%)");
    expect(result.current.prescriptionGroups).toHaveLength(2);
    expect(result.current.prescriptionGroups[0]?.prescriptionTitle).toBe("신장내과 처방전");
  });

  it("선택한 날짜의 일별 기록이 없으면 빈 목록을 표시한다", () => {
    mockQueries({
      statisticsData: mockStatisticsResponse,
      dailyRecordsData: {
        date: "2026-04-08",
        summary: {
          totalCount: 0,
          takenCount: 0,
          fraction: "0/0",
          complianceRate: 0,
        },
        records: [],
      },
    });

    const { result } = renderHook(() =>
      useMedicationCalendarViewModel(new Date("2026-04-10T00:00:00")),
    );

    act(() => {
      result.current.setSelectedDate("2026-04-08");
    });

    expect(result.current.selectedDate).toBe("2026-04-08");
    expect(result.current.selectedDaySummary).toBe("0/0 완료 (0%)");
    expect(result.current.prescriptionGroups).toHaveLength(0);
  });

  it("PENDING 상태는 복용 필요로 표시한다", () => {
    mockQueries({
      statisticsData: {
        ...mockStatisticsResponse,
        dailyCompliance: [{ date: "2026-04-07", takenCount: 1, totalCount: 2, fraction: "1/2" }],
      },
      dailyRecordsData: {
        date: "2026-04-07",
        summary: {
          totalCount: 2,
          takenCount: 1,
          fraction: "1/2",
          complianceRate: 50,
        },
        records: mockDailyRecords.records.slice(0, 2).concat({
          recordIds: [504],
          prescriptionTitle: "감기약",
          medicationNames: ["플루티카손"],
          scheduledTime: "20:00",
          takenTime: null,
          status: "PENDING" as const,
        }),
      },
    });

    const { result } = renderHook(() =>
      useMedicationCalendarViewModel(new Date("2026-04-07T00:00:00")),
    );

    const pendingItem = result.current.prescriptionGroups
      .flatMap((group) => group.items)
      .find((item) => item.status === "PENDING");

    expect(pendingItem).toEqual(
      expect.objectContaining({
        status: "PENDING",
        statusLabel: "복용 필요",
        statusTone: "missed",
        isTaken: false,
      }),
    );
  });

  it("이전 달로 이동하면 해당 월 통계 범위로 조회한다", () => {
    mockQueries({
      statisticsData: mockStatisticsResponse,
      dailyRecordsData: mockDailyRecords,
    });

    const { result } = renderHook(() =>
      useMedicationCalendarViewModel(new Date("2026-04-10T00:00:00")),
    );

    act(() => {
      result.current.goToPreviousMonth();
    });

    expect(result.current.monthLabel).toBe("2026년 3월");
    expect(result.current.canGoToNextMonth).toBe(true);
    expect(mockUseMedicationStatistics).toHaveBeenLastCalledWith(
      expect.objectContaining({
        startDate: "2026-03-01",
        endDate: "2026-03-31",
      }),
    );
  });

  it("다음 달 이동은 현재 달까지만 허용한다", () => {
    mockQueries({
      statisticsData: mockStatisticsResponse,
      dailyRecordsData: mockDailyRecords,
    });

    const { result } = renderHook(() =>
      useMedicationCalendarViewModel(new Date("2026-04-10T00:00:00")),
    );

    act(() => {
      result.current.goToPreviousMonth();
    });

    act(() => {
      result.current.goToNextMonth();
    });

    expect(result.current.monthLabel).toBe("2026년 4월");
    expect(result.current.canGoToNextMonth).toBe(false);
  });

  it("월 변경 중에는 캘린더 로딩 상태만 표시한다", () => {
    mockQueries({
      statisticsData: mockStatisticsResponse,
      dailyRecordsData: mockDailyRecords,
    });

    const { result, rerender } = renderHook(() =>
      useMedicationCalendarViewModel(new Date("2026-04-10T00:00:00")),
    );

    act(() => {
      result.current.goToPreviousMonth();
    });

    mockQueries({ isStatisticsLoading: true });
    rerender(undefined);

    expect(result.current.isInitialLoading).toBe(false);
    expect(result.current.isCalendarLoading).toBe(true);
  });

  it("초기 로딩과 일별 기록 로딩 상태를 분리해 전달한다", async () => {
    mockQueries({
      statisticsData: mockStatisticsResponse,
      isDailyRecordsLoading: true,
    });

    const { result } = renderHook(() => useMedicationCalendarViewModel());

    expect(result.current.isInitialLoading).toBe(false);
    expect(result.current.isDailyRecordsLoading).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.isDailyRecordsError).toBe(false);
  });

  it("통계 초기 로딩과 에러 상태를 전달하고 refetch를 호출한다", async () => {
    mockQueries({ isStatisticsLoading: true, isStatisticsError: true });

    const { result } = renderHook(() => useMedicationCalendarViewModel());

    expect(result.current.isInitialLoading).toBe(true);
    expect(result.current.isError).toBe(true);
    await result.current.refetch();
    expect(mockRefetchStatistics).toHaveBeenCalledTimes(1);
    expect(mockRefetchDailyRecords).toHaveBeenCalledTimes(1);
    await result.current.refetchDailyRecords();
    expect(mockRefetchDailyRecords).toHaveBeenCalledTimes(2);
  });
});
