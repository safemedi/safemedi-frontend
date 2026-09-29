import { fireEvent, render } from "@testing-library/react-native";

import { MedicationReportCalendarCard } from "../MedicationReportCalendarCard";
import { MedicationReportDailyRecordsCard } from "../MedicationReportDailyRecordsCard";

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

describe("MedicationReportCalendarCard", () => {
  it("선택 가능한 날짜와 빈 날짜, 미래 날짜를 구분해 표시한다", () => {
    const onSelectDate = jest.fn();
    const onPreviousMonth = jest.fn();
    const onNextMonth = jest.fn();
    const days = [
      { id: "empty", date: null, day: null, fraction: null, rate: null, tone: "empty" as const },
      {
        id: "green",
        date: "2026-04-01",
        day: 1,
        fraction: "3/3",
        rate: 100,
        tone: "green" as const,
      },
      {
        id: "yellow",
        date: "2026-04-02",
        day: 2,
        fraction: "2/3",
        rate: 67,
        tone: "yellow" as const,
      },
      { id: "red", date: "2026-04-03", day: 3, fraction: "1/3", rate: 33, tone: "red" as const },
      {
        id: "future",
        date: "2026-04-04",
        day: 4,
        fraction: null,
        rate: null,
        tone: "future" as const,
      },
    ];
    const { getByText, getByLabelText } = render(
      <MedicationReportCalendarCard
        monthLabel="2026년 4월"
        weeks={[days]}
        selectedDate="2026-04-01"
        onSelectDate={onSelectDate}
        onPreviousMonth={onPreviousMonth}
        onNextMonth={onNextMonth}
        canGoToNextMonth={false}
      />,
    );
    fireEvent.press(getByText("1"));
    expect(onSelectDate).toHaveBeenCalledWith("2026-04-01");
    fireEvent.press(getByLabelText("이전 달"));
    expect(onPreviousMonth).toHaveBeenCalledTimes(1);
    expect(getByText("4")).toBeTruthy();
    expect(getByText("90% 이상")).toBeTruthy();
  });

  it("로딩 중에는 달력 스켈레톤을 표시한다", () => {
    const { getByLabelText } = render(
      <MedicationReportCalendarCard
        monthLabel="2026년 4월"
        weeks={[]}
        selectedDate={null}
        onSelectDate={jest.fn()}
        onPreviousMonth={jest.fn()}
        onNextMonth={jest.fn()}
        canGoToNextMonth={false}
        isLoading
      />,
    );

    expect(getByLabelText("달력 로딩 중")).toBeTruthy();
  });
});

describe("MedicationReportDailyRecordsCard", () => {
  it("완료, 미복용, 예정 복약 기록과 빈 상태를 렌더링한다", () => {
    const groups = [
      {
        id: "rx-1",
        prescriptionTitle: "내과 처방전",
        items: [
          {
            id: "1",
            medicationName: "완료약",
            scheduledTime: "08:00",
            status: "SUCCESS" as const,
            statusLabel: "완료",
            statusTone: "taken" as const,
            isTaken: true,
          },
          {
            id: "2",
            medicationName: "미복용약",
            scheduledTime: "12:00",
            status: "PENDING" as const,
            statusLabel: "복용 필요",
            statusTone: "missed" as const,
            isTaken: false,
          },
          {
            id: "3",
            medicationName: "대기약",
            scheduledTime: "18:00",
            status: "PENDING" as const,
            statusLabel: "복용 필요",
            statusTone: "missed" as const,
            isTaken: false,
          },
        ],
      },
    ];
    const { getByText, rerender } = render(
      <MedicationReportDailyRecordsCard
        title="오늘 기록"
        summary="1/3 완료"
        prescriptionGroups={groups}
      />,
    );
    expect(getByText("완료약")).toBeTruthy();
    expect(getByText("미복용약")).toBeTruthy();
    expect(getByText("대기약")).toBeTruthy();
    rerender(
      <MedicationReportDailyRecordsCard
        title="오늘 기록"
        summary="0/0 완료"
        prescriptionGroups={[]}
      />,
    );
    expect(getByText("선택한 날짜의 복약 기록이 없습니다.")).toBeTruthy();
  });

  it("로딩 중에는 스켈레톤 UI를 표시한다", () => {
    const { getByLabelText, queryByText } = render(
      <MedicationReportDailyRecordsCard
        title="2026-04-01 복약 기록"
        summary="1/3 완료"
        prescriptionGroups={[]}
        isLoading
      />,
    );

    expect(getByLabelText("복약 기록 로딩 중")).toBeTruthy();
    expect(queryByText("선택한 날짜의 복약 기록이 없습니다.")).toBeNull();
  });
});
