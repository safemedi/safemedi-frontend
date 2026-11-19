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

export function isConfirmedAtcCode(atcCode: string): boolean {
  const code = atcCode.trim();
  return code.length > 0 && code !== "UNKNOWN";
}

export function parseAdditionalTakeTimes(input?: string): string[] {
  return (input ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function hasInvalidAdditionalTakeTimes(input?: string): boolean {
  if (!input?.trim()) return false;
  const times = parseAdditionalTakeTimes(input);
  return times.length === 0 || times.some((time) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(time));
}
