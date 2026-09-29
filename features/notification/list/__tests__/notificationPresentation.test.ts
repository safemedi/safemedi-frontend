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
