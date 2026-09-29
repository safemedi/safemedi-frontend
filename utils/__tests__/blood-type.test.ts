import {
  combineBloodTypeWithRh,
  splitBloodTypeWithRh,
  splitBloodTypeWithRhOrDefault,
} from "@/utils/blood-type";

describe("혈액형 유틸", () => {
  it("Rh가 포함된 혈액형 문자열을 분리한다", () => {
    expect(splitBloodTypeWithRh("ab-")).toEqual({
      bloodType: "AB",
      rhFactor: "negative",
    });
  });

  it("Rh 정보가 없으면 혈액형만 분리하고 Rh는 비워둔다", () => {
    expect(splitBloodTypeWithRh("O")).toEqual({
      bloodType: "O",
      rhFactor: undefined,
    });
  });

  it("잘못된 입력은 기본값으로 대체한다", () => {
    expect(splitBloodTypeWithRhOrDefault("unknown")).toEqual({
      bloodType: "O",
      rhFactor: "positive",
    });
  });

  it("혈액형과 Rh를 결합한다", () => {
    expect(combineBloodTypeWithRh("A", "positive")).toBe("A+");
    expect(combineBloodTypeWithRh("B", "negative")).toBe("B-");
  });
});
