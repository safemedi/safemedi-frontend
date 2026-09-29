import { z } from "zod";
import type { ScanMedicationItem, ScanPrescriptionDraft } from "./types";

const EMPTY_DRUG_FALLBACK = "미확인 약물";
const EMPTY_TITLE_FALLBACK = "처방전 스캔 등록";
export const DEFAULT_ATC_CODE = "UNKNOWN";
const DATE_PATTERN = /\b\d{4}[./-]\d{1,2}[./-]\d{1,2}\b/g;
const MEDICATION_KEYWORD_PATTERN = /정|캡슐|시럽|환|산제|과립|크림|연고|패치|mg|ml|mcg|IU/i;
const NON_MEDICATION_LINE_PATTERN =
  /병원|의원|약국|처방전|환자|생년월일|성별|연락처|전화|주소|발행일|조제일|보험|진료과|담당의|면허번호/;
const TABLET_APPEARANCE_PATTERN = /색|원형|장방형|타원형|코\s*팅/;
const DOSAGE_INSTRUCTION_PATTERN = /\d\s*정씩/;
const CLINIC_NAME_PATTERN = /[가-힣]{2,}(?:의원|병원|약국|한의원|치과)/;
const DAYS_SUPPLY_PATTERN = /(\d+)\s*일분/;
const DAILY_DOSE_COUNT_PATTERN = /(?:1일|하루|일일|정씩)\s*(\d+)\s*회/g;
const MAX_DAILY_DOSE_COUNT = 3;
const MIN_CONFIDENT_DATE_MATCH_COUNT = 2;

const medicationSchema = z.object({
  atcCode: z.string().min(1),
  drugName: z.string().min(1),
  drugCode: z.string().min(1).optional(),
  dailyDoseCount: z.number().int().min(1).max(MAX_DAILY_DOSE_COUNT).optional(),
});

const draftSchema = z.object({
  title: z.string(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  medications: z.array(medicationSchema).min(1),
  rawText: z.string().min(1),
  isDateRangeConfident: z.boolean().optional(),
});

function normalizeDate(rawDate: string): string {
  const normalized = rawDate.replace(/[.]/g, "-").replace(/\//g, "-");
  const [year, month, day] = normalized.split("-");
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  return `${year}-${String(monthNumber).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
}

function addDaysToToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function extractDaysSupply(rawText: string): number | undefined {
  const match = rawText.match(DAYS_SUPPLY_PATTERN);
  if (!match) {
    return undefined;
  }
  const days = Number(match[1]);
  return Number.isInteger(days) && days > 0 ? days : undefined;
}

function extractDateRangeFromDatePairs(rawText: string): {
  readonly startDate: string;
  readonly endDate: string;
  readonly isConfident: boolean;
} {
  const matches = rawText.match(DATE_PATTERN) ?? [];
  const normalized = matches.map((value) => normalizeDate(value));
  const today = new Date().toISOString().slice(0, 10);
  if (normalized.length === 0) {
    return { startDate: today, endDate: today, isConfident: false };
  }
  if (normalized.length === 1) {
    return { startDate: normalized[0], endDate: normalized[0], isConfident: false };
  }
  return {
    startDate: normalized[0],
    endDate: normalized[1],
    isConfident: normalized.length >= MIN_CONFIDENT_DATE_MATCH_COUNT,
  };
}

function resolveDateRange(rawText: string): {
  readonly startDate: string;
  readonly endDate: string;
  readonly isConfident: boolean;
} {
  const daysSupply = extractDaysSupply(rawText);
  if (daysSupply === undefined) {
    return extractDateRangeFromDatePairs(rawText);
  }
  const today = new Date().toISOString().slice(0, 10);
  return { startDate: today, endDate: addDaysToToday(daysSupply), isConfident: true };
}

// 약물명 줄과 "N정씩 N회" 복용법 줄은 원문에서 각각 등장 순서를 유지하므로,
// 같은 순번끼리 짝지어 약물별 복용 횟수로 대응시킨다. 약물/복용법 순서가
// 문서 레이아웃상 어긋나 있으면 부정확할 수 있는 휴리스틱이다.
function extractDailyDoseCounts(rawText: string): number[] {
  const matches = rawText.matchAll(DAILY_DOSE_COUNT_PATTERN);
  const counts: number[] = [];
  for (const match of matches) {
    const count = Number(match[1]);
    if (Number.isInteger(count) && count >= 1) {
      counts.push(Math.min(count, MAX_DAILY_DOSE_COUNT));
    }
  }
  return counts;
}

function normalizeMedicationName(line: string): string {
  return line.replace(/[-*•]/g, "").trim();
}

function extractMedications(rawText: string): readonly ScanMedicationItem[] {
  const lines = rawText
    .split(/\n+/)
    .map((line) => normalizeMedicationName(line))
    .filter((line) => line.length > 0);
  const medicationCandidates = lines.filter(
    (line) =>
      MEDICATION_KEYWORD_PATTERN.test(line) &&
      !NON_MEDICATION_LINE_PATTERN.test(line) &&
      !TABLET_APPEARANCE_PATTERN.test(line) &&
      !DOSAGE_INSTRUCTION_PATTERN.test(line),
  );
  const uniqueCandidates = Array.from(new Set(medicationCandidates));
  if (uniqueCandidates.length === 0) {
    return [{ atcCode: DEFAULT_ATC_CODE, drugName: EMPTY_DRUG_FALLBACK }];
  }
  const dailyDoseCounts = extractDailyDoseCounts(rawText);
  return uniqueCandidates.map((drugName, index) => {
    const dailyDoseCount = dailyDoseCounts[index];
    return dailyDoseCount === undefined
      ? { atcCode: DEFAULT_ATC_CODE, drugName }
      : { atcCode: DEFAULT_ATC_CODE, drugName, dailyDoseCount };
  });
}

function isDateOnlyLine(line: string): boolean {
  return line.replace(DATE_PATTERN, "").replace(/[\s~.-]/g, "").length === 0;
}

function extractTitle(rawText: string): string {
  const lines = rawText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const clinicNameLine = lines.find((line) => CLINIC_NAME_PATTERN.test(line));
  if (clinicNameLine) {
    return clinicNameLine;
  }
  const firstMeaningfulLine = lines.find((line) => line.length > 2 && !isDateOnlyLine(line));
  return firstMeaningfulLine ?? EMPTY_TITLE_FALLBACK;
}

export function isConfirmedAtcCode(atcCode: string): boolean {
  return atcCode.trim().length > 0 && atcCode !== DEFAULT_ATC_CODE;
}

export function isPlaceholderMedication(item: ScanMedicationItem): boolean {
  return item.atcCode === DEFAULT_ATC_CODE && item.drugName === EMPTY_DRUG_FALLBACK;
}

export function hasOnlyPlaceholderMedications(medications: readonly ScanMedicationItem[]): boolean {
  return medications.length > 0 && medications.every((item) => isPlaceholderMedication(item));
}

export function parsePrescriptionFromOcrText(rawText: string): ScanPrescriptionDraft {
  const trimmedText = rawText.trim();
  if (trimmedText.length === 0) {
    throw new Error("OCR 결과가 비어 있습니다. 이미지가 선명한지 확인해 주세요.");
  }
  const dateRange = resolveDateRange(trimmedText);
  const candidate = {
    title: extractTitle(trimmedText),
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    medications: extractMedications(trimmedText),
    rawText: trimmedText,
    isDateRangeConfident: dateRange.isConfident,
  };
  return draftSchema.parse(candidate);
}

export function parsePrescriptionFromJson(jsonText: string): ScanPrescriptionDraft {
  const parsed = JSON.parse(jsonText) as unknown;
  return draftSchema.parse(parsed);
}
