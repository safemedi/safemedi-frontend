import { profileEditSchema } from "@/features/profile/edit/schema";

const nicknameSchema = profileEditSchema.shape.displayName;

describe("프로필 닉네임 검증", () => {
  it.each(["홍길", "홍길동", "가".repeat(20)])("2~20자 닉네임을 허용한다: %s", (nickname) => {
    expect(nicknameSchema.parse(nickname)).toBe(nickname);
  });

  it("앞뒤 공백을 제거한 2자 닉네임을 허용한다", () => {
    expect(nicknameSchema.parse("  홍길  ")).toBe("홍길");
  });

  it.each([
    "",
    "   ",
    "홍",
    " 홍 ",
    "가".repeat(21),
  ])("공백 제거 후 2~20자 범위를 벗어나면 거부한다: %s", (nickname) => {
    expect(nicknameSchema.safeParse(nickname).success).toBe(false);
  });
});
