const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function parseDateTime(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getCalendarDayDiff(referenceDate: Date, targetDate: Date): number {
  const referenceDayStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const targetDayStart = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
  );
  return Math.round((referenceDayStart.getTime() - targetDayStart.getTime()) / DAY_MS);
}

function formatTimeOfDay(date: Date): string {
  const hours = date.getHours();
  const period = hours < 12 ? "오전" : "오후";
  return `${period} ${hours % 12 || 12}시`;
}

/** 알림 카드용 상대 시각 라벨 */
export function formatNotificationRelativeTime(
  value: string,
  referenceDate: Date = new Date(),
): string {
  const parsed = parseDateTime(value);
  if (!parsed) {
    return "";
  }

  const diffMs = referenceDate.getTime() - parsed.getTime();
  const dayDiff = getCalendarDayDiff(referenceDate, parsed);

  if (dayDiff === 0) {
    if (diffMs < MINUTE_MS) {
      return "방금 전";
    }
    if (diffMs < HOUR_MS) {
      const minutes = Math.floor(diffMs / MINUTE_MS);
      return `${minutes}분 전`;
    }
    if (diffMs < DAY_MS) {
      const hours = Math.floor(diffMs / HOUR_MS);
      return `${hours}시간 전`;
    }
    return `오늘 ${formatTimeOfDay(parsed)}`;
  }

  if (dayDiff <= 0) {
    return "방금 전";
  }

  if (dayDiff === 1) {
    return "어제";
  }

  if (dayDiff <= 7) {
    return `${dayDiff}일 전`;
  }

  return parsed.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
}
