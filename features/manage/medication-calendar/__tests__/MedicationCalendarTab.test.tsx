import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { MedicationCalendarTab } from "@/features/manage/medication-calendar/MedicationCalendarTab";
import { useMedicationCalendarViewModel } from "@/features/manage/medication-calendar/useMedicationCalendarViewModel";

jest.mock("@/features/manage/medication-calendar/useMedicationCalendarViewModel", () => ({
  useMedicationCalendarViewModel: jest.fn(),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
jest.mock("tamagui", () => ({
  YStack: require("react-native").View,
  Text: require("react-native").Text,
}));
jest.mock("../components/MedicationReportCalendarCard", () => ({
  MedicationReportCalendarCard: () => null,
}));
jest.mock("../components/MedicationReportDailyRecordsCard", () => ({
  MedicationReportDailyRecordsCard: () => null,
}));
jest.mock("../../medication-statistics/components/MedicationReportPeriodSummaryCard", () => ({
  MedicationReportPeriodSummaryCard: () => null,
}));

function setViewModel(overrides: Record<string, unknown> = {}) {
  jest.mocked(useMedicationCalendarViewModel).mockReturnValue({
    isInitialLoading: false,
    isCalendarLoading: false,
    isDailyRecordsLoading: false,
    isError: false,
    ...overrides,
  } as unknown as ReturnType<typeof useMedicationCalendarViewModel>);
}

describe("복약 달력 화면의 초기 조회", () => {
  it.each([
    "isInitialLoading",
    "isCalendarLoading",
    "isDailyRecordsLoading",
  ])("%s 동안 일부 콘텐츠를 표시하지 않는다", (flag) => {
    setViewModel({ [flag]: true });
    const screen = render(<MedicationCalendarTab header={<Text>복약 리포트 헤더</Text>} />);
    expect(screen.getByLabelText("복약 리포트 로딩 중")).toBeTruthy();
    expect(screen.queryByText("복약 리포트 헤더")).toBeNull();
    setViewModel();
    screen.rerender(<MedicationCalendarTab header={<Text>복약 리포트 헤더</Text>} />);
    expect(screen.queryByLabelText("복약 리포트 로딩 중")).toBeNull();
    expect(screen.getByText("복약 리포트 헤더")).toBeTruthy();
  });
});
