import { render } from "@testing-library/react-native";
import type { DashboardScheduleCardItem } from "../../useDashboardViewModel";
import { TodayScheduleSection } from "../TodayScheduleSection";

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    Text: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(Text, props, children),
    YStack: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

const mockTodayScheduleCard = jest.fn<null, [{ item: DashboardScheduleCardItem }]>(() => null);

jest.mock("../TodayScheduleCard", () => ({
  TodayScheduleCard: (props: { item: DashboardScheduleCardItem }) => mockTodayScheduleCard(props),
}));

const ITEMS: readonly DashboardScheduleCardItem[] = [
  {
    id: "1",
    scheduledTime: "08:00",
    prescriptionCount: 1,
    prescriptions: [
      {
        id: "1-08:00-1",
        prescriptionId: 1,
        prescriptionTitle: "아침",
        medicationCount: 1,
        medicationNames: ["타이레놀"],
        recordIds: [1],
        canMarkAsTaken: false,
        tone: "success",
      },
    ],
    statusLabel: "완료",
    tone: "success",
  },
  {
    id: "2",
    scheduledTime: "20:00",
    prescriptionCount: 1,
    prescriptions: [
      {
        id: "2-20:00-2",
        prescriptionId: 2,
        prescriptionTitle: "저녁",
        medicationCount: 1,
        medicationNames: ["아목시실린"],
        recordIds: [2],
        canMarkAsTaken: true,
        tone: "required",
      },
    ],
    statusLabel: "복용 필요",
    tone: "required",
  },
];

describe("TodayScheduleSection", () => {
  const mockOnPressTake = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("남은 개수 뱃지와 스케줄 카드 목록을 렌더링한다", () => {
    const { getByText } = render(
      <TodayScheduleSection
        remainingCount={2}
        items={ITEMS}
        takingPrescriptionId={null}
        onPressTake={mockOnPressTake}
      />,
    );

    expect(getByText("오늘의 복약 스케줄")).toBeTruthy();
    expect(getByText("2개 남음")).toBeTruthy();
    expect(mockTodayScheduleCard).toHaveBeenCalledTimes(2);
  });

  it("아이템이 없으면 빈 상태 문구를 렌더링한다", () => {
    const { getByText } = render(
      <TodayScheduleSection
        remainingCount={0}
        items={[]}
        takingPrescriptionId={null}
        onPressTake={mockOnPressTake}
      />,
    );

    expect(getByText("오늘 예정된 복약 스케줄이 없습니다.")).toBeTruthy();
    expect(mockTodayScheduleCard).not.toHaveBeenCalled();
  });
});
