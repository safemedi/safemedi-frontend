import { palette } from "@/constants/design-tokens";

import { getNotificationPresentation } from "../notificationPresentation";

describe("getNotificationPresentation", () => {
  it("약물 상호작용 경고는 경고 배지를 표시한다", () => {
    expect(getNotificationPresentation("DRUG_INTERACTION_WARNING")).toEqual({
      iconName: "warning-outline",
      gradientColors: [palette.red_medium, palette.pink],
      showActionBadge: true,
    });
  });

  it("가족 연동 알림은 연동/해제에 맞는 아이콘과 색상을 표시한다", () => {
    expect(getNotificationPresentation("FAMILY_CONNECTED")).toEqual({
      iconName: "person-add-outline",
      gradientColors: [palette.green, palette.opal],
      showActionBadge: false,
    });
    expect(getNotificationPresentation("FAMILY_DISCONNECTED")).toEqual({
      iconName: "person-remove-outline",
      gradientColors: [palette.orange, palette.red_medium],
      showActionBadge: false,
    });
  });

  it("지원하지 않는 타입이나 문자열이 아닌 값은 기본 presentation을 반환한다", () => {
    expect(getNotificationPresentation("UNKNOWN_TYPE")).toEqual({
      iconName: "notifications-outline",
      gradientColors: [palette.blue, palette.purple],
      showActionBadge: false,
    });
    expect(getNotificationPresentation(null)).toEqual({
      iconName: "notifications-outline",
      gradientColors: [palette.blue, palette.purple],
      showActionBadge: false,
    });
  });
});
