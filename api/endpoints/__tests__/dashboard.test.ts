import { apiPaths } from "@/api/paths";
import { fetchTodayMedicationSchedules, updateMedicationRecord } from "../dashboard";

const mockApiGet = jest.fn();
const mockApiPatch = jest.fn();

jest.mock("@/api/client", () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
    patch: (...args: unknown[]) => mockApiPatch(...args),
  },
}));

describe("api/endpoints/dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("오늘 복약 스케줄 요청 시 today 엔드포인트를 사용한다", async () => {
    const expected = { summary: { completedCount: 1, totalCount: 4 }, schedules: [] };
    const mockJson = jest.fn(async () => expected);
    mockApiGet.mockReturnValueOnce({ json: mockJson });

    const result = await fetchTodayMedicationSchedules();

    expect(mockApiGet).toHaveBeenCalledWith(apiPaths.medicationRecordsToday);
    expect(result).toEqual(expected);
  });

  it("복약 기록 상태 변경 시 record 엔드포인트에 PATCH 요청한다", async () => {
    const expected = {
      recordId: 57,
      prescriptionId: 8,
      scheduledAt: "2026-06-30T08:00:00",
      takenAt: "2026-06-30T08:03:00",
      status: "SUCCESS",
    };
    const mockJson = jest.fn(async () => expected);
    mockApiPatch.mockReturnValueOnce({ json: mockJson });

    const result = await updateMedicationRecord(57, { status: "SUCCESS" });

    expect(mockApiPatch).toHaveBeenCalledWith(apiPaths.medicationRecord(57), {
      json: { status: "SUCCESS" },
    });
    expect(result).toEqual(expected);
  });
});
