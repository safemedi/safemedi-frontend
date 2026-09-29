import { formatNotificationRelativeTime } from "@/utils/format-relative-time";

describe("formatNotificationRelativeTime", () => {
  const referenceDate = new Date("2026-04-07T14:00:00Z");

  it("1분 미만이면 방금 전을 반환한다", () => {
    expect(formatNotificationRelativeTime("2026-04-07T13:59:30Z", referenceDate)).toBe("방금 전");
  });

  it("1시간 미만이면 분 단위를 반환한다", () => {
    expect(formatNotificationRelativeTime("2026-04-07T13:50:00Z", referenceDate)).toBe("10분 전");
  });

  it("24시간 미만이면 시간 단위를 반환한다", () => {
    expect(formatNotificationRelativeTime("2026-04-07T12:00:00Z", referenceDate)).toBe("2시간 전");
  });

  it("어제 알림이면 어제를 반환한다", () => {
    expect(formatNotificationRelativeTime("2026-04-06T14:00:00Z", referenceDate)).toBe("어제");
  });

  it("오늘 알림이면 시간 단위를 반환한다", () => {
    expect(formatNotificationRelativeTime("2026-04-07T13:00:00Z", referenceDate)).toBe("1시간 전");
  });

  it("7일 이내면 n일 전을 반환한다", () => {
    expect(formatNotificationRelativeTime("2026-04-05T14:00:00Z", referenceDate)).toBe("2일 전");
  });

  it("잘못된 날짜 문자열이면 빈 문자열을 반환한다", () => {
    expect(formatNotificationRelativeTime("invalid", referenceDate)).toBe("");
  });

  it("7일보다 오래된 알림은 월일 형식을 반환한다", () => {
    expect(formatNotificationRelativeTime("2026-03-20T14:00:00Z", referenceDate)).toContain("3월");
  });

  it("timezone이 없는 서버 시각은 기기 로컬 기준 상대 시간을 계산한다", () => {
    const localReferenceDate = new Date(2026, 3, 7, 14, 0, 0);

    expect(formatNotificationRelativeTime("2026-04-07T13:50:00", localReferenceDate)).toBe(
      "10분 전",
    );
  });
});
