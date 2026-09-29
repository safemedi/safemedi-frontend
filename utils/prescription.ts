export const PRESCRIPTION_TITLE_MIN_LENGTH = 2;
export const PRESCRIPTION_TITLE_MAX_LENGTH = 20;

export function getPrescriptionTitleError(
  title: string,
  fieldLabel: "제목" | "이름" = "제목",
): string | null {
  const trimmed = title.trim();

  if (trimmed.length === 0) {
    return `처방전 ${fieldLabel}을 입력해주세요.`;
  }
  if (
    trimmed.length < PRESCRIPTION_TITLE_MIN_LENGTH ||
    trimmed.length > PRESCRIPTION_TITLE_MAX_LENGTH
  ) {
    return `처방전 ${fieldLabel}은 ${PRESCRIPTION_TITLE_MIN_LENGTH}~${PRESCRIPTION_TITLE_MAX_LENGTH}자로 입력해주세요.`;
  }

  return null;
}
