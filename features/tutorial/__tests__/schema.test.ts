import { tutorialStep1Schema } from "@/features/tutorial/schema";

describe("튜토리얼 Step1 스키마", () => {
  it("유효한 Step1 입력값을 허용한다", () => {
    const result = tutorialStep1Schema.safeParse({
      birthDate: "950101",
      height: "170",
      weight: "65",
      bloodType: "AB",
      rhFactor: "positive",
      gender: "female",
    });

    expect(result.success).toBe(true);
  });

  it("허용 범위 내 소수 입력 문자열을 허용한다", () => {
    const result = tutorialStep1Schema.safeParse({
      birthDate: "990101",
      height: "170,4",
      weight: "65.7",
      bloodType: "A",
      rhFactor: "negative",
      gender: "male",
    });

    expect(result.success).toBe(true);
  });

  it("범위를 벗어난 숫자 입력을 거부한다", () => {
    const result = tutorialStep1Schema.safeParse({
      birthDate: "950101",
      height: "49",
      weight: "9",
      bloodType: "B",
      rhFactor: "positive",
      gender: "female",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("height"))).toBe(true);
      expect(result.error.issues.some((issue) => issue.path.includes("weight"))).toBe(true);
    }
  });

  it("유효하지 않은 생년월일 형식을 거부한다", () => {
    const result = tutorialStep1Schema.safeParse({
      birthDate: "950231",
      height: "170",
      weight: "65",
      bloodType: "O",
      rhFactor: "positive",
      gender: "male",
    });

    expect(result.success).toBe(false);
  });

  it("필수값이 비어 있으면 거부한다", () => {
    const result = tutorialStep1Schema.safeParse({
      birthDate: "",
      height: "",
      weight: "",
      bloodType: undefined,
      rhFactor: undefined,
      gender: undefined,
    });

    expect(result.success).toBe(false);
  });
});
