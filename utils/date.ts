const DATE_FORMAT_OPTIONS = { year: "numeric", month: "2-digit", day: "2-digit" } as const;

function normalizeDatePart(value: number): string {
  return value.toString().padStart(2, "0");
}

export function formatDateToIso(date: Date): string {
  const year = date.getFullYear();
  const month = normalizeDatePart(date.getMonth() + 1);
  const day = normalizeDatePart(date.getDate());
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsedDate = new Date(year, month, day);
  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }
  return parsedDate;
}

export function formatDateLabel(value: string): string {
  const parsedDate = parseIsoDate(value);
  if (!parsedDate) {
    return "날짜를 선택해주세요";
  }
  return parsedDate.toLocaleDateString("ko-KR", DATE_FORMAT_OPTIONS);
}

const COMPACT_BIRTH_DATE_PATTERN = /^\d{6}$/;

/** YYMMDD → API `birthDate`(YYYY-MM-DD). 파싱 실패 시 null */
export function parseCompactBirthDate(
  value: string,
  referenceDate: Date = new Date(),
): string | null {
  const trimmed = value.trim();
  if (!COMPACT_BIRTH_DATE_PATTERN.test(trimmed)) {
    return null;
  }

  const yy = Number(trimmed.slice(0, 2));
  const month = Number(trimmed.slice(2, 4));
  const day = Number(trimmed.slice(4, 6));
  const pivot = referenceDate.getFullYear() % 100;
  const century = Math.floor(referenceDate.getFullYear() / 100);
  const year = yy <= pivot ? century * 100 + yy : (century - 1) * 100 + yy;
  const iso = `${year}-${normalizeDatePart(month)}-${normalizeDatePart(day)}`;
  const parsedDate = parseIsoDate(iso);
  if (!parsedDate) {
    return null;
  }

  const normalizedReferenceDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );

  return parsedDate <= normalizedReferenceDate ? iso : null;
}

/** YYYY-MM-DD → YYMMDD. 파싱 실패 시 null */
export function formatBirthDateToCompact(isoDate: string): string | null {
  const parsedDate = parseIsoDate(isoDate);
  if (!parsedDate) {
    return null;
  }

  const yy = normalizeDatePart(parsedDate.getFullYear() % 100);
  const month = normalizeDatePart(parsedDate.getMonth() + 1);
  const day = normalizeDatePart(parsedDate.getDate());
  return `${yy}${month}${day}`;
}
