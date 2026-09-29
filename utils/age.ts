import { formatDateToIso } from "@/utils/date";

/** 만 나이 → API `birthDate`(YYYY-MM-DD). 기준일 기준으로 역산합니다. */
export function manAgeToBirthDate(age: number, referenceDate: Date = new Date()): string {
  const year = referenceDate.getFullYear() - age;
  const month = referenceDate.getMonth();
  const day = referenceDate.getDate();
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

  return formatDateToIso(new Date(year, month, Math.min(day, lastDayOfMonth)));
}

/** `birthDate` → 만 나이. 파싱 실패 시 undefined */
export function birthDateToManAge(
  birthDate: string,
  referenceDate: Date = new Date(),
): number | undefined {
  const parsed = Date.parse(`${birthDate}T00:00:00`);
  if (Number.isNaN(parsed)) {
    return undefined;
  }

  const birth = new Date(parsed);
  let age = referenceDate.getFullYear() - birth.getFullYear();
  const monthDiff = referenceDate.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : undefined;
}
