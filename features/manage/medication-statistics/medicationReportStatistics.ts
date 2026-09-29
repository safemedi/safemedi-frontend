import type {
  MedicationStatisticsDailyCompliance,
  MedicationStatisticsResponse,
} from "@/api/types/medications";

export type MedicationReportWeeklyComplianceTone = "success" | "warning" | "future";

export interface MedicationReportWeeklyComplianceItem {
  readonly dayLabel: string;
  readonly rate: number | null;
  readonly fraction: string | null;
  readonly tone: MedicationReportWeeklyComplianceTone;
}

export interface MedicationReportPeriodSummary {
  readonly complianceRate: number;
  readonly periodRangeLabel: string;
  readonly totalTaken: number;
  readonly totalScheduled: number;
  readonly fraction: string;
  readonly perfectDaysCount: number;
  readonly attentionDaysCount: number;
}

export type MedicationStatisticsIngredientRiskLevel = "CAUTION" | "DANGER";

export interface MedicationReportCautionIngredientItem {
  readonly id: string;
  readonly name: string;
  readonly monthlyIntakeCount: number;
  readonly riskLevel: MedicationStatisticsIngredientRiskLevel;
  readonly riskLabel: string;
}

const WEEKDAY_FULL_LABELS = [
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
  "일요일",
] as const;

const MONTHLY_COMPLIANCE_GOAL = 80;
const WEEKLY_SUCCESS_RATE = 90;
const PERFECT_DAY_RATE = 100;

function formatDateToApiParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseApiDate(dateText: string): Date | null {
  const parsedDate = new Date(`${dateText}T00:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatKoreanMonthDay(dateText: string): string {
  const parsedDate = parseApiDate(dateText);
  if (!parsedDate) return dateText;
  return `${parsedDate.getMonth() + 1}월 ${parsedDate.getDate()}일`;
}

function clampRate(rate: number): number {
  if (!Number.isFinite(rate)) return 0;
  return Math.max(0, Math.min(100, Math.round(rate)));
}

function resolveWeeklyComplianceTone(rate: number): MedicationReportWeeklyComplianceTone {
  return rate >= WEEKLY_SUCCESS_RATE ? "success" : "warning";
}

function resolveDayRate(entry: MedicationStatisticsDailyCompliance): number {
  if (entry.totalCount === 0) return 0;
  return clampRate((entry.takenCount / entry.totalCount) * 100);
}

function buildPeriodFraction(takenCount: number, totalCount: number): string {
  return `${takenCount}/${totalCount}`;
}

export function getMedicationReportWeekRange(today: Date): {
  readonly startDate: string;
  readonly endDate: string;
  readonly weekStart: Date;
} {
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(today);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(today.getDate() + diffToMonday);

  return {
    startDate: formatDateToApiParam(weekStart),
    endDate: formatDateToApiParam(today),
    weekStart,
  };
}

export function getMedicationReportMonthRange(today: Date): {
  readonly startDate: string;
  readonly endDate: string;
} {
  return getMedicationReportMonthRangeForViewMonth(today, today);
}

export function getMedicationReportMonthRangeForViewMonth(
  viewMonth: Date,
  today: Date,
): {
  readonly startDate: string;
  readonly endDate: string;
} {
  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const monthEnd = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
  const isCurrentMonth =
    monthStart.getFullYear() === today.getFullYear() && monthStart.getMonth() === today.getMonth();

  return {
    startDate: formatDateToApiParam(monthStart),
    endDate: isCurrentMonth ? formatDateToApiParam(today) : formatDateToApiParam(monthEnd),
  };
}

export function buildMedicationReportWeeklyCompliance(
  dailyCompliance: readonly MedicationStatisticsDailyCompliance[],
  weekStart: Date,
  today: Date,
): readonly MedicationReportWeeklyComplianceItem[] {
  const complianceByDate = new Map(dailyCompliance.map((entry) => [entry.date, entry]));
  const todayText = formatDateToApiParam(today);

  return WEEKDAY_FULL_LABELS.map((dayLabel, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const dateText = formatDateToApiParam(date);
    const entry = complianceByDate.get(dateText);

    if (dateText > todayText) {
      return {
        dayLabel,
        rate: null,
        fraction: null,
        tone: "future" as const,
      };
    }

    if (!entry || entry.totalCount === 0) {
      return {
        dayLabel,
        rate: 0,
        fraction: "0/0",
        tone: "warning" as const,
      };
    }

    const rate = resolveDayRate(entry);
    return {
      dayLabel,
      rate,
      fraction: entry.fraction,
      tone: resolveWeeklyComplianceTone(rate),
    };
  });
}

export function buildMedicationReportPeriodSummary(
  statistics: MedicationStatisticsResponse | undefined,
  today: Date,
): MedicationReportPeriodSummary {
  const periodRangeLabel = statistics
    ? `${formatKoreanMonthDay(statistics.startDate)} ~ ${formatKoreanMonthDay(statistics.endDate)}`
    : `${today.getMonth() + 1}월 1일`;

  const { perfectDaysCount, attentionDaysCount } = countComplianceDayBuckets(
    statistics?.dailyCompliance ?? [],
    today,
  );

  const totalTaken = statistics?.totalTaken ?? 0;
  const totalScheduled = statistics?.totalScheduled ?? 0;

  return {
    complianceRate: clampRate(statistics?.totalComplianceRate ?? 0),
    periodRangeLabel,
    totalTaken,
    totalScheduled,
    fraction: buildPeriodFraction(totalTaken, totalScheduled),
    perfectDaysCount,
    attentionDaysCount,
  };
}

export function countComplianceDayBuckets(
  dailyCompliance: readonly MedicationStatisticsDailyCompliance[],
  today: Date,
): {
  readonly perfectDaysCount: number;
  readonly attentionDaysCount: number;
} {
  const todayText = formatDateToApiParam(today);
  let perfectDaysCount = 0;
  let attentionDaysCount = 0;

  dailyCompliance.forEach((entry) => {
    if (entry.date > todayText || entry.totalCount === 0) {
      return;
    }

    const rate = resolveDayRate(entry);
    if (rate >= PERFECT_DAY_RATE) {
      perfectDaysCount += 1;
      return;
    }

    attentionDaysCount += 1;
  });

  return { perfectDaysCount, attentionDaysCount };
}

export function deriveMedicationReportMonthlyAchievements(
  statistics: MedicationStatisticsResponse | undefined,
): readonly string[] {
  if (!statistics) {
    return [];
  }

  const achievements: string[] = [];

  if (statistics.totalComplianceRate >= MONTHLY_COMPLIANCE_GOAL) {
    achievements.push(`이번 달 평균 이행률 목표(${MONTHLY_COMPLIANCE_GOAL}%) 초과`);
  }

  let currentStreak = 0;
  let maxStreak = 0;

  statistics.dailyCompliance.forEach((entry) => {
    const isPerfectDay = entry.totalCount > 0 && entry.takenCount === entry.totalCount;
    if (isPerfectDay) {
      currentStreak += 1;
      maxStreak = Math.max(maxStreak, currentStreak);
      return;
    }

    currentStreak = 0;
  });

  if (maxStreak >= 3) {
    achievements.push(`연속 ${maxStreak}일 완벽한 복약 달성!`);
  }

  return achievements;
}

export function buildComplianceByDate(
  dailyCompliance: readonly MedicationStatisticsDailyCompliance[],
): ReadonlyMap<string, MedicationStatisticsDailyCompliance> {
  return new Map(dailyCompliance.map((entry) => [entry.date, entry]));
}

export function resolveSelectedDaySummary(
  entry: MedicationStatisticsDailyCompliance | undefined,
): string {
  if (!entry || entry.totalCount === 0) {
    return "0/0 완료 (0%)";
  }

  const rate = resolveDayRate(entry);
  return `${entry.fraction} 완료 (${rate}%)`;
}
