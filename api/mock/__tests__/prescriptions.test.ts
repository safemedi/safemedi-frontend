import { registerSaf26Mocks } from "@/api/mock/handlers";
import { MockRegistry } from "@/api/mock/registry";
import { mockState } from "@/api/mock/state";
import type { PrescriptionListItem } from "@/api/types";

function clonePrescriptions(
  prescriptions: readonly PrescriptionListItem[],
): PrescriptionListItem[] {
  return prescriptions.map((prescription) => ({
    ...prescription,
    medications: prescription.medications.map((medication) => ({
      ...medication,
      takeTimes: [...medication.takeTimes],
    })),
  }));
}

describe("처방전 mock", () => {
  const initialPrescriptions = clonePrescriptions(mockState.prescriptions);
  const initialMedicationIdSeq = mockState.medicationIdSeq;
  const initialPrescriptionIdSeq = mockState.prescriptionIdSeq;

  beforeEach(() => {
    mockState.prescriptions = clonePrescriptions(initialPrescriptions);
    mockState.medicationIdSeq = initialMedicationIdSeq;
    mockState.prescriptionIdSeq = initialPrescriptionIdSeq;
  });

  it("수정 및 삭제 결과를 다음 목록 조회에 반영한다", async () => {
    const registry = new MockRegistry();
    registerSaf26Mocks(registry);
    const context = {
      path: "/api/v1/prescriptions/11",
      searchParams: new URLSearchParams(),
    };
    const patchRoute = registry.find("PATCH", context.path);
    const deleteRoute = registry.find("DELETE", context.path);
    const getRoute = registry.find("GET", "/api/v1/prescriptions");
    const detailRoute = registry.find("GET", context.path);

    if (!patchRoute || !deleteRoute || !getRoute || !detailRoute) {
      throw new Error("처방전 mock route가 등록되지 않았습니다.");
    }

    await patchRoute.handler({
      ...context,
      method: "PATCH",
      jsonBody: {
        medications: [
          {
            prescriptionDrugId: 101,
            takeTimes: ["09:00", "20:00"],
          },
        ],
      },
    });

    const updated = await getRoute.handler({
      method: "GET",
      path: "/api/v1/prescriptions",
      searchParams: new URLSearchParams(),
      jsonBody: undefined,
    });
    expect(updated).toMatchObject({
      content: expect.arrayContaining([
        expect.objectContaining({
          prescriptionId: 11,
          drugCount: 2,
        }),
      ]),
    });
    const detail = await detailRoute.handler({
      ...context,
      method: "GET",
      jsonBody: undefined,
    });
    expect(detail).toMatchObject({
      medications: expect.arrayContaining([
        expect.objectContaining({ prescriptionDrugId: 101, takeTimes: ["09:00", "20:00"] }),
      ]),
    });

    await deleteRoute.handler({ ...context, method: "DELETE", jsonBody: undefined });

    const deleted = await getRoute.handler({
      method: "GET",
      path: "/api/v1/prescriptions",
      searchParams: new URLSearchParams(),
      jsonBody: undefined,
    });
    expect(deleted).toMatchObject({
      content: [expect.objectContaining({ prescriptionId: 12 })],
    });
  });

  it("처방전 수정 시 prescriptionDrugId 기준으로 복약 시간을 변경한다", async () => {
    const registry = new MockRegistry();
    registerSaf26Mocks(registry);
    const patchRoute = registry.find("PATCH", "/api/v1/prescriptions/11");

    if (!patchRoute) {
      throw new Error("처방전 PATCH mock route가 등록되지 않았습니다.");
    }

    await patchRoute.handler({
      method: "PATCH",
      path: "/api/v1/prescriptions/11",
      searchParams: new URLSearchParams(),
      jsonBody: {
        medications: [
          {
            prescriptionDrugId: 101,
            takeTimes: ["09:00", "20:00"],
          },
        ],
      },
    });

    const updated = mockState.prescriptions.find(
      (prescription) => prescription.prescriptionId === 11,
    );
    expect(updated?.medications[0]).toMatchObject({
      drugName: "타이레놀정 500mg",
      takeTimes: ["09:00", "20:00"],
    });
  });

  it("처방전 등록 시 알러지 충돌을 약물별로 계산한다", async () => {
    const registry = new MockRegistry();
    registerSaf26Mocks(registry);
    const postRoute = registry.find("POST", "/api/v1/prescriptions");

    if (!postRoute) {
      throw new Error("처방전 POST mock route가 등록되지 않았습니다.");
    }

    const response = await postRoute.handler({
      method: "POST",
      path: "/api/v1/prescriptions",
      searchParams: new URLSearchParams(),
      jsonBody: {
        title: "혼합 처방전",
        medications: [
          {
            drugCode: "202000123",
            atcCode: "J01CA04",
            drugName: "아목시실린 캡슐",
            takeTimes: ["08:00"],
          },
          {
            drugCode: "S01XA20",
            atcCode: "S01XA20",
            drugName: "인공눈물",
            takeTimes: ["12:00"],
          },
        ],
      },
    });

    expect(response).toMatchObject({
      hasAllergyConflict: true,
    });

    const created = mockState.prescriptions.find(
      (prescription) => prescription.title === "혼합 처방전",
    );
    expect(created?.medications).toEqual([
      expect.objectContaining({
        atcCode: "J01CA04",
        drugName: "아목시실린 캡슐",
        hasWarning: true,
        warningMessage: "알러지 충돌이 발견되었습니다. 의사와 상담 후 복용하세요.",
      }),
      expect.objectContaining({
        atcCode: "S01XA20",
        drugName: "인공눈물",
        hasWarning: false,
        warningMessage: null,
      }),
    ]);
  });
});
