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

  it("PENDING(취소) 처리 시 완료된 스케줄을 대기 상태로 되돌리고 completedCount를 감소시킨다", () => {
    const updated = applyOptimisticMedicationRecordUpdate(baseData, 3, { status: "PENDING" });

    expect(updated.schedules[2]?.displayStatus).toBe("WAITING");
    expect(updated.summary.completedCount).toBe(0);
    expect(updated.summary.completionRate).toBe(0);
  });

  it("한 약봉투(스케줄)에 recordIds가 여러 개 있어도 봉투 단위로 1건만 완료 처리한다", () => {
    // GET /medication-records/today 명세 예시와 동일한 형태: 08:00 봉투는 drugCount 2,
    // recordIds [101, 102]를 함께 갖고 있고, 완료 시 completedCount는 recordId 개수(2)가 아니라
    // 봉투 개수(1)만큼만 증가한다.
    const envelopeData: TodayMedicationSchedulesResponse = {
      date: "2026-06-05",
      summary: { totalCount: 4, completedCount: 0, completionRate: 0 },
      schedules: [
        {
          takeTime: "08:00",
          prescriptionId: 25,
          prescriptionTitle: "신장내과 처방전",
          drugCount: 2,
          recordIds: [101, 102],
          displayStatus: "NEED_TAKE",
        },
        {
          takeTime: "14:00",
          prescriptionId: 25,
          prescriptionTitle: "신장내과 처방전",
          drugCount: 1,
          recordIds: [103],
          displayStatus: "NEED_TAKE",
        },
      ],
    };

    const updated = applyOptimisticMedicationRecordsUpdate(envelopeData, [101, 102], {
      status: "SUCCESS",
    });

    expect(updated.schedules[0]?.displayStatus).toBe("SUCCESS");
    expect(updated.schedules[1]?.displayStatus).toBe("NEED_TAKE");
    expect(updated.summary.completedCount).toBe(1);
    expect(updated.summary.completionRate).toBe(25);
  });
});
