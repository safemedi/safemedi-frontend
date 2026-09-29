import {
  formatMedicationTakeTimesLabel,
  isPrescriptionExpanded,
  mapPrescriptionsToManagementGroups,
  toggleCollapsedPrescriptionId,
} from "../medicationManagementModel";

describe("medicationManagementModel", () => {
  const prescriptions = [
    {
      prescriptionId: 11,
      title: "신장내과 처방전",
      medications: [
        {
          medicationId: 101,
          atcCode: "N02BE01",
          drugName: "타이레놀정 500mg",
          takeTimes: ["08:00", "18:00", "22:00"],
          mainIngredient: "아세트아미노펜",
          hasWarning: false,
        },
      ],
    },
  ] as const;

  it("복용 시간 라벨을 포맷한다", () => {
    expect(formatMedicationTakeTimesLabel(["08:00", "18:00"])).toBe("08:00, 18:00 복용");
    expect(formatMedicationTakeTimesLabel([])).toBe("복용 시간 미설정");
  });

  it("처방전 목록을 화면 모델로 변환한다", () => {
    const groups = mapPrescriptionsToManagementGroups(prescriptions);

    expect(groups[0]).toEqual({
      id: "11",
      prescriptionId: 11,
      title: "신장내과 처방전",
      medicationCountLabel: "1개",
      medications: [
        {
          id: "101",
          medicationId: 101,
          drugName: "타이레놀정 500mg",
          takeTimesLabel: "08:00, 18:00, 22:00 복용",
          mainIngredient: "아세트아미노펜",
          hasWarning: false,
          warningMessage: null,
        },
      ],
    });
  });

  it("처방전 펼침 상태를 토글한다", () => {
    expect(isPrescriptionExpanded(new Set(), 11)).toBe(true);

    const collapsed = toggleCollapsedPrescriptionId(new Set(), 11);
    expect(isPrescriptionExpanded(collapsed, 11)).toBe(false);
    expect(isPrescriptionExpanded(toggleCollapsedPrescriptionId(collapsed, 11), 11)).toBe(true);
  });
});
