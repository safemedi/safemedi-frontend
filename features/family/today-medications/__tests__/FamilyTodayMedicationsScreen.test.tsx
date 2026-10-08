import { fireEvent, render } from "@testing-library/react-native";
import { router } from "expo-router";
import { useFamilyTodayMedicationSchedules } from "@/api/queries/dashboard";
import { FamilyTodayMedicationsScreen } from "@/features/family/today-medications/FamilyTodayMedicationsScreen";

const mockRefetch = jest.fn();
let mockFamilyId: string | string[] | undefined = "12";
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ familyId: mockFamilyId, name: "김영희" }),
  router: { back: jest.fn(), push: jest.fn() },
}));
jest.mock("@/api/queries/dashboard", () => ({ useFamilyTodayMedicationSchedules: jest.fn() }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
jest.mock("tamagui", () => {
  const { View, Text } = require("react-native");
  return { XStack: View, YStack: View, Text };
});
const mockQuery = jest.mocked(useFamilyTodayMedicationSchedules);
const schedules = ["SUCCESS", "NEED_TAKE", "WAITING", "MISSED", "SKIP"].map((status, index) => ({
  takeTime: `${8 + index}:00`,
  status,
  prescriptionId: index + 1,
  prescriptionTitle: `처방전 ${index + 1}`,
  drugCount: 2,
  recordIds: [index + 1],
}));
function setQuery(overrides: Record<string, unknown> = {}) {
  mockQuery.mockReturnValue({
    data: {
      date: "2026-10-01",
      summary: { completedCount: 1, totalCount: 5, completionRate: 20 },
      schedules,
    },
    isLoading: false,
    isError: false,
    isRefetching: false,
    refetch: mockRefetch,
    ...overrides,
  } as unknown as ReturnType<typeof useFamilyTodayMedicationSchedules>);
}
describe("가족 오늘 복약 화면", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFamilyId = "12";
    setQuery();
  });
  it("선택한 가족의 요약과 모든 복약 상태를 표시한다", () => {
    const screen = render(<FamilyTodayMedicationsScreen />);
    expect(mockQuery).toHaveBeenCalledWith(12);
    expect(screen.getByText("김영희님의 오늘 복약")).toBeTruthy();
    expect(screen.getByText("오늘 복약 이행률 20%")).toBeTruthy();
    for (const label of ["복용 완료", "복용 필요", "대기", "미복용", "건너뜀"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });
  it("하단 버튼으로 선택한 가족의 건강정보 화면에 이동한다", () => {
    const screen = render(<FamilyTodayMedicationsScreen />);
    fireEvent.press(screen.getByLabelText("가족의 의료진 제공용 건강정보 보기"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/family/health-info",
      params: { familyId: "12" },
    });
  });
  it("조회 실패 시 다시 시도할 수 있다", () => {
    setQuery({ isError: true });
    const screen = render(<FamilyTodayMedicationsScreen />);
    fireEvent.press(screen.getByText("다시 시도"));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("처방전 1")).toBeNull();
    expect(screen.queryByLabelText("가족의 의료진 제공용 건강정보 보기")).toBeNull();
  });
  it("로딩 중에는 버튼을 숨기고 완료 후 복약 정보와 함께 표시한다", () => {
    setQuery({ isLoading: true, data: undefined });
    const screen = render(<FamilyTodayMedicationsScreen />);
    expect(screen.getByLabelText("복약 정보 불러오는 중")).toBeTruthy();
    expect(screen.queryByLabelText("가족의 의료진 제공용 건강정보 보기")).toBeNull();

    setQuery();
    screen.rerender(<FamilyTodayMedicationsScreen />);
    expect(screen.queryByLabelText("복약 정보 불러오는 중")).toBeNull();
    expect(screen.getByText("오늘 복약 이행률 20%")).toBeTruthy();
    expect(screen.getByLabelText("가족의 의료진 제공용 건강정보 보기")).toBeTruthy();
  });
  it("일정이 없으면 빈 목록 안내를 표시한다", () => {
    setQuery({
      data: {
        date: "2026-10-01",
        summary: { completedCount: 0, totalCount: 0, completionRate: 0 },
        schedules: [],
      },
    });
    expect(
      render(<FamilyTodayMedicationsScreen />).getByText("오늘 예정된 복약 스케줄이 없습니다."),
    ).toBeTruthy();
  });
  it.each([
    undefined,
    "0",
    "-1",
    "abc",
    ["12", "13"],
  ])("잘못된 가족 ID %s는 본인 조회로 대체하지 않는다", (familyId) => {
    mockFamilyId = familyId;
    expect(
      render(<FamilyTodayMedicationsScreen />).getByText("가족 정보를 확인할 수 없습니다."),
    ).toBeTruthy();
    expect(mockQuery).toHaveBeenCalledWith(undefined);
  });
});
