import { getPrescriptionTitleError } from "@/utils/prescription";

describe("처방전 제목 유효성 검사", () => {
  it("빈 문자열은 입력 안내 메시지를 반환한다", () => {
    expect(getPrescriptionTitleError("   ")).toBe("처방전 제목을 입력해주세요.");
    expect(getPrescriptionTitleError("", "이름")).toBe("처방전 이름을 입력해주세요.");
  });

  it("2자 미만이면 글자수 제한 메시지를 반환한다", () => {
    expect(getPrescriptionTitleError("A")).toBe("처방전 제목은 2~20자로 입력해주세요.");
  });

  it("20자를 초과하면 글자수 제한 메시지를 반환한다", () => {
    expect(getPrescriptionTitleError("가".repeat(21))).toBe("처방전 제목은 2~20자로 입력해주세요.");
  });

  it("2~20자 사이면 유효하다고 판단한다", () => {
    expect(getPrescriptionTitleError("신장내과 처방전")).toBeNull();
    expect(getPrescriptionTitleError("가".repeat(20))).toBeNull();
  });
});
