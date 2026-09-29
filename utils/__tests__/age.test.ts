import { birthDateToManAge, manAgeToBirthDate } from "@/utils/age";

const referenceDate = new Date("2026-06-27T12:00:00");

describe("age utils", () => {
  it("만 나이를 birthDate로 역산한다", () => {
    expect(manAgeToBirthDate(23, referenceDate)).toBe("2003-06-27");
  });

  it("역산한 연도에 기준일이 없으면 해당 월의 마지막 날로 보정한다", () => {
    const leapDay = new Date("2028-02-29T12:00:00");

    expect(manAgeToBirthDate(1, leapDay)).toBe("2027-02-28");
  });

  it("birthDate에서 만 나이를 계산한다", () => {
    expect(birthDateToManAge("2003-06-27", referenceDate)).toBe(23);
    expect(birthDateToManAge("2003-06-28", referenceDate)).toBe(22);
  });

  it("잘못된 birthDate는 undefined를 반환한다", () => {
    expect(birthDateToManAge("invalid", referenceDate)).toBeUndefined();
  });
});
