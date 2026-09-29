import { fireEvent, render } from "@testing-library/react-native";
import { DashboardTopHeader } from "../DashboardTopHeader";
import { RecentPrescriptionsSection } from "../RecentPrescriptionsSection";
import { ScanPrescriptionCard } from "../ScanPrescriptionCard";

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    Text: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(Text, props, children),
    XStack: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
    YStack: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

describe("dashboard home subcomponents", () => {
  it("DashboardTopHeader는 알림 버튼 클릭을 전달한다", () => {
    const onPressNotification = jest.fn();
    const { getByLabelText, getByText } = render(
      <DashboardTopHeader onPressNotification={onPressNotification} hasUnreadNotification />,
    );

    expect(getByText("안녕하세요! 👋")).toBeTruthy();
    fireEvent.press(getByLabelText("알림 화면 열기"));
    expect(onPressNotification).toHaveBeenCalledTimes(1);
  });

  it("RecentPrescriptionsSection은 아이템이 없으면 빈 상태를 보여준다", () => {
    const { getByText } = render(<RecentPrescriptionsSection items={[]} onPressItem={jest.fn()} />);

    expect(getByText("최근 처방전 기록이 없습니다.")).toBeTruthy();
  });

  it("RecentPrescriptionsSection은 아이템 클릭 시 onPressItem을 호출한다", () => {
    const onPressItem = jest.fn();
    const item = { id: "1", dateLabel: "2026-05-20", analysisCount: 2, hasWarning: true };
    const { getByText } = render(
      <RecentPrescriptionsSection items={[item]} onPressItem={onPressItem} />,
    );

    fireEvent.press(getByText("2026-05-20"));
    expect(onPressItem).toHaveBeenCalledWith(item);
    expect(getByText("경고 있음")).toBeTruthy();
  });

  it("ScanPrescriptionCard는 클릭 이벤트를 전달한다", () => {
    const onPress = jest.fn();
    const { getByLabelText, getByText } = render(<ScanPrescriptionCard onPress={onPress} />);

    expect(getByText("처방전 스캔하기")).toBeTruthy();
    fireEvent.press(getByLabelText("처방전 스캔하기"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
