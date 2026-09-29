import {
  formatBirthDateToCompact,
  formatDateLabel,
  formatDateToIso,
  parseCompactBirthDate,
  parseIsoDate,
} from "../date";

describe("utils/date", () => {
  it("formatDateToIso는 YYYY-MM-DD 형식 문자열을 반환한다", () => {
    const date = new Date(2026, 4, 3);

    expect(formatDateToIso(date)).toBe("2026-05-03");
  });

  it("parseIsoDate는 유효한 ISO 날짜 문자열을 Date로 변환한다", () => {
    const result = parseIsoDate("2026-05-03");

    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2026);
    expect(result?.getMonth()).toBe(4);
    expect(result?.getDate()).toBe(3);
  });

  it("parseIsoDate는 유효하지 않은 날짜 문자열이면 null을 반환한다", () => {
    expect(parseIsoDate("2026/05/03")).toBeNull();
    expect(parseIsoDate("2026-02-30")).toBeNull();
  });

  it("formatDateLabel은 유효하지 않은 입력이면 기본 안내 문구를 반환한다", () => {
    expect(formatDateLabel("")).toBe("날짜를 선택해주세요");
  });

  it("parseCompactBirthDate는 YYMMDD를 YYYY-MM-DD로 변환한다", () => {
    const referenceDate = new Date("2026-06-27T12:00:00");

    expect(parseCompactBirthDate("950101", referenceDate)).toBe("1995-01-01");
    expect(parseCompactBirthDate("000315", referenceDate)).toBe("2000-03-15");
  });

  it("parseCompactBirthDate는 유효하지 않은 날짜면 null을 반환한다", () => {
    expect(parseCompactBirthDate("950231")).toBeNull();
    expect(parseCompactBirthDate("9501")).toBeNull();
  });

  it("parseCompactBirthDate는 기준일 이후 날짜면 null을 반환한다", () => {
    const referenceDate = new Date("2026-06-29T12:00:00");

    expect(parseCompactBirthDate("261231", referenceDate)).toBeNull();
    expect(parseCompactBirthDate("260629", referenceDate)).toBe("2026-06-29");
  });

  it("formatBirthDateToCompact는 YYYY-MM-DD를 YYMMDD로 변환한다", () => {
    expect(formatBirthDateToCompact("1995-01-01")).toBe("950101");
    expect(formatBirthDateToCompact("1999-01-01")).toBe("990101");
  });
});
