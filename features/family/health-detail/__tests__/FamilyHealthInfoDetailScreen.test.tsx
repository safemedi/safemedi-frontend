import { fireEvent, render } from "@testing-library/react-native";
import { useFamilyMedicalSummary } from "@/api/queries/family";
import { FamilyHealthInfoDetailScreen } from "@/features/family/health-detail/FamilyHealthInfoDetailScreen";

let mockFamilyId: string | string[] | undefined = "12";
let mockAccessToken: string | null = "token";
const mockRefetch = jest.fn();
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ familyId: mockFamilyId }),
  router: { back: jest.fn() },
}));
jest.mock("@/api/queries/family", () => ({ useFamilyMedicalSummary: jest.fn() }));
jest.mock("@/api/error", () => ({
  getHttpStatus: (error: { status?: number } | null) => error?.status,
}));
jest.mock("@/stores/sessionStore", () => ({
  useSessionStore: (selector: (state: { accessToken: string | null }) => unknown) =>
    selector({ accessToken: mockAccessToken }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
jest.mock("tamagui", () => ({ YStack: require("react-native").View }));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: require("react-native").View }));
jest.mock("@expo/vector-icons/Ionicons", () => "Icon");

const summary = {
  name: "김예시",
  birthDate: "1970-05-15",
  gender: "FEMALE",
  height: 160,
  weight: 55,
  bloodType: "A",
  rhType: "PLUS",
  allergies: [{ type: "ATC_GROUP", value: "J01C", name: "페니실린계 항생제" }],
  diseases: [{ code: "J30", name: "알레르기성 비염" }],
  activeMedications: [
    {
      prescriptionId: 42,
      prescriptionTitle: "이비인후과 감기약",
      startDate: "2026-05-10",
      endDate: "2026-05-17",
      medications: [{ drugName: "타이레놀정500mg" }],
    },
  ],
};
function setQuery(overrides: Record<string, unknown> = {}) {
  jest.mocked(useFamilyMedicalSummary).mockReturnValue({
    data: summary,
    error: null,
    isError: false,
    isLoading: false,
    isRefetching: false,
    refetch: mockRefetch,
    ...overrides,
  } as unknown as ReturnType<typeof useFamilyMedicalSummary>);
}

describe("가족 의료진 제공용 건강정보", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFamilyId = "12";
    mockAccessToken = "token";
    setQuery();
  });
  it("선택한 가족의 기본정보와 알러지, 질환, 복용 중인 약물을 표시한다", () => {
    const screen = render(<FamilyHealthInfoDetailScreen />);
    expect(useFamilyMedicalSummary).toHaveBeenCalledWith(12);
    for (const text of [
      "김예시",
      "1970.05.15",
      "여성",
      "160 cm",
      "55 kg",
      "A (Rh+)",
      "페니실린계 항생제",
      "알레르기성 비염",
      "이비인후과 감기약",
      "타이레놀정500mg",
    ])
      expect(screen.getByText(text)).toBeTruthy();
  });
  it("빈 알러지와 질환 카드를 숨기고 복용 약물이 없는 상태를 표시한다", () => {
    setQuery({ data: { ...summary, allergies: [], diseases: [], activeMedications: [] } });
    const screen = render(<FamilyHealthInfoDetailScreen />);
    expect(screen.queryByText("약물 알러지")).toBeNull();
    expect(screen.queryByText("기저질환")).toBeNull();
    expect(screen.getByText("현재 복용 중인 약물이 없습니다.")).toBeTruthy();
  });
  it.each([
    [403, "해당 가족이 건강 정보 공개를 허용하지 않았습니다."],
    [404, "존재하지 않거나 연동이 해제된 가족입니다."],
    [401, "다시 로그인해 주세요."],
  ])("%s 오류에서는 캐시된 건강정보를 숨긴다", (status, message) => {
    setQuery({ isError: true, error: { status } });
    const screen = render(<FamilyHealthInfoDetailScreen />);
    expect(screen.getByText(String(message))).toBeTruthy();
    expect(screen.queryByText("김예시")).toBeNull();
    expect(screen.queryByText("다시 시도")).toBeNull();
  });
  it("일시적인 오류는 재시도할 수 있다", () => {
    setQuery({ isError: true, error: { status: 500 } });
    const screen = render(<FamilyHealthInfoDetailScreen />);
    fireEvent.press(screen.getByText("다시 시도"));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
  it("로그아웃 상태에서는 캐시된 가족 정보를 표시하지 않는다", () => {
    mockAccessToken = null;
    const screen = render(<FamilyHealthInfoDetailScreen />);
    expect(screen.getByText("다시 로그인해 주세요.")).toBeTruthy();
    expect(screen.queryByText("김예시")).toBeNull();
  });
  it.each([
    undefined,
    "0",
    "-1",
    "abc",
    ["12", "13"],
  ])("잘못된 가족 ID %s로 본인 정보를 표시하지 않는다", (familyId) => {
    mockFamilyId = familyId;
    const screen = render(<FamilyHealthInfoDetailScreen />);
    expect(useFamilyMedicalSummary).toHaveBeenCalledWith(undefined);
    expect(screen.getByText("가족 정보를 확인할 수 없습니다.")).toBeTruthy();
    expect(screen.queryByText("김예시")).toBeNull();
  });
  it("로딩 중에는 진행 상태를 표시한다", () => {
    setQuery({ data: undefined, isLoading: true });
    expect(
      render(<FamilyHealthInfoDetailScreen />).getByLabelText("가족 건강정보 불러오는 중"),
    ).toBeTruthy();
  });
});
