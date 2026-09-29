import type { TodayMedicationSchedulesResponse } from "@/api/types/dashboard";
import {
  applyOptimisticMedicationRecordsUpdate,
  applyOptimisticMedicationRecordUpdate,
} from "../optimisticTodayMedicationSchedules";

const baseData: TodayMedicationSchedulesResponse = {
  date: "2026-05-19",
  summary: { totalCount: 4, completedCount: 1, completionRate: 25 },
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
    {
      takeTime: "20:00",
      prescriptionId: 2,
      prescriptionTitle: "저녁약",
      drugCount: 1,
      recordIds: [3],
      status: "SUCCESS",
    },
  ],
};

describe("optimisticTodayMedicationSchedules", () => {
  it("recordId에 해당하는 스케줄을 SUCCESS로 낙관적 반영하고 summary를 갱신한다", () => {
    const updated = applyOptimisticMedicationRecordUpdate(baseData, 1, { status: "SUCCESS" });

    expect(updated.schedules[0]?.displayStatus).toBe("SUCCESS");
    expect(updated.schedules[1]?.displayStatus).toBe("NEED_TAKE");
    expect(updated.summary.completedCount).toBe(2);
    expect(updated.summary.completionRate).toBe(50);
  });

  it("여러 recordId를 한 번에 낙관적 반영한다", () => {
    const updated = applyOptimisticMedicationRecordsUpdate(baseData, [1, 2], {
      status: "SUCCESS",
    });

    expect(updated.schedules[0]?.displayStatus).toBe("SUCCESS");
    expect(updated.schedules[1]?.displayStatus).toBe("SUCCESS");
    expect(updated.summary.completedCount).toBe(3);
    expect(updated.summary.completionRate).toBe(75);
  });
});
