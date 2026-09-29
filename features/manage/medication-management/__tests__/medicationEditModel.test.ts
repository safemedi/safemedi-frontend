import {
  buildUpdatedMedicationsAfterEdit,
  convertTakeSlotsToTimes,
  convertTakeTimesToTakeSlots,
  createMedicationEditDraft,
  isMedicationEditDraftSavable,
  toggleMedicationEditTakeSlot,
  validateMedicationEditDraft,
} from "../medicationEditModel";

describe("데이터가 없으면 기본값을 반환한다.", () => {
  const prescription = {
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
      {
        medicationId: 102,
        atcCode: "A02BC01",
        drugName: "오메프라졸캡슐 20mg",
        takeTimes: ["08:00"],
        mainIngredient: "오메프라졸",
        hasWarning: false,
      },
    ],
  } as const;

  it("복용 시간을 슬롯으로 변환한다", () => {
    expect(convertTakeTimesToTakeSlots(["08:00", "13:00", "19:00"])).toEqual([
      "MORNING",
      "LUNCH",
      "DINNER",
    ]);
    expect(convertTakeTimesToTakeSlots(["18:00", "22:00"])).toEqual(["DINNER"]);
  });

  it("슬롯을 복용 시간으로 변환한다", () => {
    expect(convertTakeSlotsToTimes(["MORNING", "DINNER"])).toEqual(["08:00", "19:00"]);
  });

  it("편집 draft를 생성하고 검증한다", () => {
    const draft = createMedicationEditDraft(prescription, 101);

    expect(draft).toEqual({
      drugName: "타이레놀정 500mg",
      drugCode: "",
      atcCode: "N02BE01",
      takeSlots: ["MORNING", "DINNER"],
      originalTakeTimes: ["08:00", "18:00", "22:00"],
      hasChangedTakeSlots: false,
    });
    expect(isMedicationEditDraftSavable(draft)).toBe(true);
    if (!draft) {
      throw new Error("draft should exist");
    }
    expect(validateMedicationEditDraft({ ...draft, atcCode: "" }).isValid).toBe(false);
  });

  it("필수 입력값이 없거나 존재하지 않는 약물은 편집할 수 없다", () => {
    const draft = createMedicationEditDraft(prescription, 101);
    expect(createMedicationEditDraft(prescription, 999)).toBeNull();
    expect(isMedicationEditDraftSavable(null)).toBe(false);
    if (!draft) {
      throw new Error("draft should exist");
    }

    expect(validateMedicationEditDraft({ ...draft, drugName: "   " })).toEqual({
      isValid: false,
      message: "약물명을 입력해주세요.",
    });
    expect(validateMedicationEditDraft({ ...draft, atcCode: "   " })).toEqual({
      isValid: false,
      message: "약물 코드가 없는 약물은 수정할 수 없습니다.",
    });
    expect(validateMedicationEditDraft({ ...draft, takeSlots: [] })).toEqual({
      isValid: false,
      message: "복약 시간을 최소 1개 이상 선택해주세요.",
    });
  });

  it("복약 시간 슬롯을 토글한다", () => {
    const draft = createMedicationEditDraft(prescription, 101);
    expect(draft).not.toBeNull();
    if (!draft) {
      throw new Error("draft should exist");
    }

    const withoutMorning = toggleMedicationEditTakeSlot(draft, "MORNING");
    expect(withoutMorning.takeSlots).toEqual(["DINNER"]);

    const withLunch = toggleMedicationEditTakeSlot(withoutMorning, "LUNCH");
    expect(withLunch.takeSlots).toEqual(["DINNER", "LUNCH"]);
  });

  it("약물 수정 PATCH body는 복약 시간만 생성한다", () => {
    const draft = {
      drugName: "타이레놀정 500mg",
      drugCode: "",
      atcCode: "N02BE01",
      takeSlots: ["MORNING", "LUNCH"] as const,
      originalTakeTimes: ["08:00", "18:00", "22:00"],
      hasChangedTakeSlots: true,
    };

    expect(buildUpdatedMedicationsAfterEdit(prescription, 101, draft)).toEqual([
      {
        prescriptionDrugId: 101,
        takeTimes: ["08:00", "13:00"],
      },
      {
        prescriptionDrugId: 102,
        takeTimes: ["08:00"],
      },
    ]);
  });

  it("시간 슬롯을 변경하지 않으면 기존 복약 시간을 유지한다", () => {
    const draft = createMedicationEditDraft(prescription, 101);
    if (!draft) {
      throw new Error("draft should exist");
    }

    expect(buildUpdatedMedicationsAfterEdit(prescription, 101, draft)[0]?.takeTimes).toEqual([
      "08:00",
      "18:00",
      "22:00",
    ]);
  });
});
