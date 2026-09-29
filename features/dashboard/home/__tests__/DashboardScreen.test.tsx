import { fireEvent, render } from "@testing-library/react-native";
import { router } from "expo-router";
import { DashboardScreen } from "../DashboardScreen";
import type { DashboardViewModel } from "../useDashboardViewModel";

const mockRefetch = jest.fn<Promise<unknown>, []>();
const mockUseDashboardViewModel = jest.fn<DashboardViewModel, []>();

jest.mock("expo-router", () => ({
  __esModule: true,
  router: {
    push: jest.fn(),
  },
}));

let mockPreviousFocusEffect: (() => undefined | (() => void)) | null = null;

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: (callback: () => undefined | (() => void)) => {
    if (callback === mockPreviousFocusEffect) {
      return;
    }
    mockPreviousFocusEffect = callback;
    callback();
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../useDashboardViewModel", () => ({
  useDashboardViewModel: () => mockUseDashboardViewModel(),
}));

jest.mock("@/api/queries/notification", () => ({
  useUnreadNotificationCount: () => ({
    data: { unreadCount: 1 },
  }),
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

jest.mock("../components/DashboardTopHeader", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    DashboardTopHeader: ({
      onPressNotification,
    }: {
      onPressNotification: () => void;
      hasUnreadNotification: boolean;
    }) =>
      React.createElement(
        Pressable,
        {
          onPress: onPressNotification,
          accessibilityRole: "button",
          accessibilityLabel: "알림 버튼",
        },
        React.createElement(Text, null, "헤더"),
      ),
  };
});

jest.mock("../components/ScanPrescriptionCard", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    ScanPrescriptionCard: ({ onPress }: { onPress: () => void }) =>
      React.createElement(
        Pressable,
        { onPress, accessibilityRole: "button", accessibilityLabel: "처방전 스캔하기" },
        React.createElement(Text, null, "스캔 카드"),
      ),
  };
});

jest.mock("../components/AdherenceSummaryCard", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    AdherenceSummaryCard: ({
      adherenceRate,
      adherenceSummaryText,
    }: {
      adherenceRate: number;
      adherenceSummaryText: string;
    }) => React.createElement(Text, null, `이행률:${adherenceRate}:${adherenceSummaryText}`),
  };
});

jest.mock("../components/TodayScheduleSection", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    TodayScheduleSection: ({
      remainingCount,
      items,
    }: {
      remainingCount: number;
      items: readonly unknown[];
    }) => React.createElement(Text, null, `스케줄:${remainingCount}:${items.length}`),
  };
});

jest.mock("../components/RecentPrescriptionsSection", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    RecentPrescriptionsSection: ({
      items,
      onPressItem,
    }: {
      items: readonly { id: string }[];
      onPressItem: (item: { id: string }) => void;
    }) =>
      React.createElement(
        Pressable,
        {
          onPress: () => items[0] && onPressItem(items[0]),
          accessibilityRole: "button",
          accessibilityLabel: "최근 처방전 기록",
        },
        React.createElement(Text, null, `최근기록:${items.length}`),
      ),
  };
});

jest.mock("../components/HealthTipCard", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    HealthTipCard: ({ title, description }: { title: string; description: string }) =>
      React.createElement(Text, null, `팁:${title}:${description}`),
  };
});

function createViewModel(overrides?: Partial<DashboardViewModel>): DashboardViewModel {
  return {
    adherenceRate: 25,
    adherenceSummaryText: "1 / 4 완료",
    scheduleRemainingCount: 1,
    scheduleCards: [
      {
        id: "1",
        scheduledTime: "08:00",
        prescriptionCount: 1,
        prescriptions: [
          {
            id: "1-08:00-1",
            prescriptionId: 1,
            prescriptionTitle: "신장내과 처방전",
            medicationCount: 2,
            medicationNames: ["타이레놀", "암로디핀"],
            recordIds: [1, 2],
            canMarkAsTaken: false,
            tone: "success",
          },
        ],
        statusLabel: "완료",
        tone: "success",
      },
    ],
    recentPrescriptions: [
      {
        id: "11",
        prescriptionId: 11,
        dateLabel: "신장내과 처방전",
        analysisCount: 3,
        hasWarning: true,
      },
    ],
    healthTipTitle: "건강 팁",
    healthTipDescription: "충분한 물과 함께 복용하세요.",
    isLoading: false,
    isError: false,
    takingPrescriptionId: null,
    markPrescriptionAsTaken: jest.fn(),
    // 실제 useDashboardViewModel처럼 훅 호출마다 새 함수 참조를 반환해
    // DashboardScreen의 focus effect가 참조 불안정성에 견고한지 검증한다.
    refetch: () => mockRefetch(),
    ...overrides,
  };
}

describe("DashboardScreen 통합 테스트", () => {
  const mockRouterPush = router.push as jest.MockedFunction<typeof router.push>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPreviousFocusEffect = null;
    mockUseDashboardViewModel.mockImplementation(() => createViewModel());
  });

  it("정상 상태에서 대시보드 주요 섹션을 렌더링한다", () => {
    const { getByText } = render(<DashboardScreen />);

    expect(getByText("헤더")).toBeTruthy();
    expect(getByText("스캔 카드")).toBeTruthy();
    expect(getByText("이행률:25:1 / 4 완료")).toBeTruthy();
    expect(getByText("스케줄:1:1")).toBeTruthy();
    expect(getByText("최근기록:1")).toBeTruthy();
    expect(getByText("팁:건강 팁:충분한 물과 함께 복용하세요.")).toBeTruthy();
  });

  it("처방전 스캔 카드 클릭 시 스캔 상세 화면으로 이동한다", () => {
    const { getByLabelText } = render(<DashboardScreen />);

    fireEvent.press(getByLabelText("처방전 스캔하기"));

    expect(mockRouterPush).toHaveBeenCalledWith("/(detail)/scan/scan");
  });

  it("알림 버튼 클릭 시 알림 화면으로 이동한다", () => {
    const { getByLabelText } = render(<DashboardScreen />);

    fireEvent.press(getByLabelText("알림 버튼"));

    expect(mockRouterPush).toHaveBeenCalledWith("/(detail)/notifications");
  });

  it("최근 처방전 기록 클릭 시 prescriptionId를 상세 화면으로 전달한다", () => {
    const { getByLabelText } = render(<DashboardScreen />);

    fireEvent.press(getByLabelText("최근 처방전 기록"));

    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: "/(detail)/dashboard/medication-history",
      params: { prescriptionId: "11" },
    });
  });

  it("로딩 상태에서 로딩 메시지를 노출한다", () => {
    mockUseDashboardViewModel.mockReturnValue(
      createViewModel({
        isLoading: true,
      }),
    );

    const { getByText, queryByText } = render(<DashboardScreen />);

    expect(getByText("대시보드 정보를 불러오는 중입니다.")).toBeTruthy();
    expect(queryByText("이행률:25:1 / 4 완료")).toBeNull();
  });

  it("에러 상태에서 다시 시도 버튼 클릭 시 refetch를 호출한다", () => {
    mockUseDashboardViewModel.mockReturnValue(
      createViewModel({
        isError: true,
      }),
    );

    const { getByLabelText } = render(<DashboardScreen />);
    const callCountBeforeRetry = mockRefetch.mock.calls.length;
    fireEvent.press(getByLabelText("다시 시도 버튼"));

    expect(mockRefetch.mock.calls.length).toBe(callCountBeforeRetry + 1);
  });

  it("화면에 포커스될 때마다 대시보드 데이터를 새로고침한다", () => {
    render(<DashboardScreen />);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it("리렌더링되어도 focus effect가 다시 실행되어 과도하게 refetch되지 않는다", () => {
    const { rerender } = render(<DashboardScreen />);
    const callCountAfterMount = mockRefetch.mock.calls.length;

    rerender(<DashboardScreen />);

    expect(mockRefetch.mock.calls.length).toBe(callCountAfterMount);
  });
});
