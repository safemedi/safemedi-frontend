import { fireEvent, render } from "@testing-library/react-native";
import { router } from "expo-router";
import { MedicationHistoryScreen } from "../MedicationHistoryScreen";
import type { MedicationHistoryViewModel } from "../types";

const mockRefetch = jest.fn<Promise<unknown>, []>();
const mockUseMedicationHistoryViewModel = jest.fn<
  MedicationHistoryViewModel,
  [string | undefined]
>();
const mockUseLocalSearchParams = jest.fn(() => ({ prescriptionId: "11" }));

jest.mock("expo-router", () => ({
  __esModule: true,
  router: {
    back: jest.fn(),
    push: jest.fn(),
  },
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../useMedicationHistoryViewModel", () => ({
  useMedicationHistoryViewModel: (prescriptionIdParam: string | undefined) =>
    mockUseMedicationHistoryViewModel(prescriptionIdParam),
}));

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

jest.mock("../components/MedicationHistoryHeader", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    MedicationHistoryHeader: ({
      title,
      dateLabel,
      onPressBack,
    }: {
      title: string;
      dateLabel: string;
      onPressBack: () => void;
    }) =>
      React.createElement(
        Pressable,
        { onPress: onPressBack, accessibilityRole: "button", accessibilityLabel: "뒤로가기 버튼" },
        React.createElement(Text, null, `${title}:${dateLabel}`),
      ),
  };
});

jest.mock("../components/MedicationWarningBanner", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    MedicationWarningBanner: ({ description }: { description: string }) =>
      React.createElement(Text, null, `경고배너:${description}`),
  };
});

jest.mock("../components/MedicationHistoryCard", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    MedicationHistoryCard: ({
      medication,
      onPressApprove,
    }: {
      medication: { id: string; medicationName: string };
      onPressApprove: () => void;
    }) =>
      React.createElement(
        Pressable,
        {
          onPress: onPressApprove,
          accessibilityRole: "button",
          accessibilityLabel: `승인 버튼:${medication.id}`,
        },
        React.createElement(Text, null, `약물카드:${medication.medicationName}`),
      ),
  };
});

jest.mock("@/components/ui/PillButton", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    PillButton: ({ onPress, children }: { onPress: () => void; children: React.ReactNode }) =>
      React.createElement(
        Pressable,
        { onPress, accessibilityRole: "button", accessibilityLabel: "다시 시도 버튼" },
        typeof children === "string" ? React.createElement(Text, null, children) : children,
      ),
  };
});

jest.mock("@/components/ui/SectionHeader", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    SectionHeader: ({ title }: { title: string }) =>
      React.createElement(Text, null, `섹션:${title}`),
  };
});

jest.mock("@/components/ui/SurfaceCard", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    SurfaceCard: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

function createViewModel(
  overrides?: Partial<MedicationHistoryViewModel>,
): MedicationHistoryViewModel {
  return {
    displayDate: "2026.04.06",
    warningSummary: "일부 약물에 경고 사항이 있습니다. 의사와 상담 후 복용하세요.",
    medications: [
      {
        id: "500",
        medicationName: "타이레놀정 500mg",
        scheduledTimesLabel: "08:00 복용",
        activeIngredients: ["아세트아미노펜"],
        tone: "safe",
        warningItems: [],
      },
    ],
    isLoading: false,
    isError: false,
    refetch: mockRefetch,
    ...overrides,
  };
}

describe("MedicationHistoryScreen", () => {
  const mockRouterBack = router.back as jest.MockedFunction<typeof router.back>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ prescriptionId: "11" });
    mockUseMedicationHistoryViewModel.mockReturnValue(createViewModel());
  });

  it("쿼리 파라미터 prescriptionId를 viewModel 훅에 전달한다", () => {
    render(<MedicationHistoryScreen />);

    expect(mockUseMedicationHistoryViewModel).toHaveBeenCalledWith("11");
  });

  it("정상 상태에서 헤더/경고배너/약물카드를 렌더링한다", () => {
    const { getByText } = render(<MedicationHistoryScreen />);

    expect(getByText("스캔 기록 상세:2026.04.06")).toBeTruthy();
    expect(
      getByText("경고배너:일부 약물에 경고 사항이 있습니다. 의사와 상담 후 복용하세요."),
    ).toBeTruthy();
    expect(getByText("섹션:등록된 약물")).toBeTruthy();
    expect(getByText("약물카드:타이레놀정 500mg")).toBeTruthy();
  });

  it("헤더 뒤로가기 클릭 시 router.back을 호출한다", () => {
    const { getByLabelText } = render(<MedicationHistoryScreen />);

    fireEvent.press(getByLabelText("뒤로가기 버튼"));

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });

  it("에러 상태에서 다시 시도 클릭 시 refetch를 호출한다", () => {
    mockUseMedicationHistoryViewModel.mockReturnValue(
      createViewModel({
        isError: true,
      }),
    );
    const { getByLabelText } = render(<MedicationHistoryScreen />);

    fireEvent.press(getByLabelText("다시 시도 버튼"));

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("약물 데이터가 없으면 빈 상태 문구를 노출한다", () => {
    mockUseMedicationHistoryViewModel.mockReturnValue(
      createViewModel({
        warningSummary: null,
        medications: [],
      }),
    );

    const { getByText } = render(<MedicationHistoryScreen />);
    expect(getByText("등록된 복약 기록이 없습니다.")).toBeTruthy();
  });
});
