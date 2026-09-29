import { api } from "@/api/client";
import { fetchMedicationRecords, fetchMedicationStatistics } from "@/api/endpoints/medications";
import { apiPaths } from "@/api/paths";

jest.mock("@/api/client", () => ({
  api: {
    get: jest.fn(),
  },
}));

const mockApiGet = api.get as jest.Mock;

describe("medications endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("일별 복약 기록 조회 시 type과 date를 전달한다", async () => {
    const wireResponse = {
      type: "DAILY",
      date: "2026-05-12",
      summary: { totalCount: 2, takenCount: 1, fraction: "1/2" },
      records: [],
    };
    mockApiGet.mockReturnValueOnce({ json: jest.fn(async () => wireResponse) });

    const result = await fetchMedicationRecords({ type: "DAILY", date: "2026-05-12" });

    expect(mockApiGet).toHaveBeenCalledWith(apiPaths.medicationRecords, {
      searchParams: { type: "DAILY", date: "2026-05-12" },
    });
    expect(result).toEqual({
      date: "2026-05-12",
      summary: {
        totalCount: 2,
        takenCount: 1,
        fraction: "1/2",
        complianceRate: 50,
      },
      records: [],
    });
  });

  it("일별 복약 기록 summary가 누락돼도 기본값으로 정규화한다", async () => {
    const wireResponse = {
      type: "DAILY",
      date: "2026-05-12",
      records: [],
    };
    mockApiGet.mockReturnValueOnce({ json: jest.fn(async () => wireResponse) });

    const result = await fetchMedicationRecords({ type: "DAILY", date: "2026-05-12" });

    expect(result).toEqual({
      date: "2026-05-12",
      summary: {
        totalCount: 0,
        takenCount: 0,
        fraction: "0/0",
        complianceRate: 0,
      },
      records: [],
    });
  });

  it("월간 복약 기록 조회 시 date를 해당 월 1일로 정규화한다", async () => {
    const wireResponse = {
      type: "MONTH",
      periodStartDate: "2026-05-01",
      periodEndDate: "2026-05-31",
      summary: { totalCount: 4, takenCount: 3, fraction: "3/4" },
      dailyRecords: [],
    };
    mockApiGet.mockReturnValueOnce({ json: jest.fn(async () => wireResponse) });

    const result = await fetchMedicationRecords({ type: "MONTH", date: "2026-05-19" });

    expect(mockApiGet).toHaveBeenCalledWith(apiPaths.medicationRecords, {
      searchParams: { type: "MONTH", date: "2026-05-01" },
    });
    expect(result).toEqual({
      period: "2026-05",
      summary: {
        totalCount: 4,
        takenCount: 3,
        fraction: "3/4",
        complianceRate: 75,
      },
      records: [],
    });
  });

  it("복약 통계 조회 시 startDate와 endDate를 전달하고 응답을 정규화한다", async () => {
    const wireResponse = {
      startDate: "2026-05-14",
      endDate: "2026-05-20",
      totalCount: 10,
      takenCount: 7,
      fraction: "7/10",
      dailyCompliance: [],
    };
    mockApiGet.mockReturnValueOnce({ json: jest.fn(async () => wireResponse) });

    const result = await fetchMedicationStatistics({
      startDate: "2026-05-14",
      endDate: "2026-05-20",
    });

    expect(mockApiGet).toHaveBeenCalledWith(apiPaths.medicationsStatistics, {
      searchParams: { startDate: "2026-05-14", endDate: "2026-05-20" },
    });
    expect(result).toEqual({
      startDate: "2026-05-14",
      endDate: "2026-05-20",
      totalScheduled: 10,
      totalTaken: 7,
      totalComplianceRate: 70,
      dailyCompliance: [],
    });
  });
});
