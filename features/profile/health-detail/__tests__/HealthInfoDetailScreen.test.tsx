import { fireEvent, render } from "@testing-library/react-native";
import { router } from "expo-router";
import { Alert } from "react-native";

import { HealthInfoDetailScreen } from "../HealthInfoDetailScreen";

const mockUseHealthInfo = jest.fn();
const mockUseUserStore = jest.fn();

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LinearGradient: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock("@expo/vector-icons/Ionicons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ name }: { name: string }) => React.createElement(Text, null, name);
});

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
  },
}));

jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: { user: unknown }) => unknown) => mockUseUserStore(selector),
  useHealthInfo: () => mockUseHealthInfo(),
}));

describe("HealthInfoDetailScreen", () => {
  const mockRouterBack = router.back as jest.MockedFunction<typeof router.back>;
  const mockAlert = jest.spyOn(Alert, "alert").mockImplementation(jest.fn());

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHealthInfo.mockReturnValue({
      allergies: ["페니실린", "아스피린"],
      chronicConditions: ["고혈압", "당뇨병"],
    });
    mockUseUserStore.mockImplementation((selector: (state: { user: unknown }) => unknown) =>
      selector({
        user: {
          displayName: "홍길동",
          birthDate: "1985-03-15",
          gender: "male",
          height: 175,
          weight: 68,
          bloodType: "A+",
        },
      }),
    );
  });

  it("건강 정보 상세 화면 핵심 섹션을 렌더링한다", () => {
    const { getByText } = render(<HealthInfoDetailScreen />);

    expect(getByText("건강 정보 확인")).toBeTruthy();
    expect(getByText("의료진 확인용 정보")).toBeTruthy();
    expect(getByText("환자 기본 정보")).toBeTruthy();
    expect(getByText("약물 알러지")).toBeTruthy();
    expect(getByText("기저질환")).toBeTruthy();
    expect(getByText("의료진 참고사항")).toBeTruthy();
    expect(getByText("175 cm")).toBeTruthy();
    expect(getByText("68 kg")).toBeTruthy();
    expect(getByText("A (Rh+)")).toBeTruthy();
  });

  it("뒤로가기 버튼 클릭 시 router.back을 호출한다", () => {
    const { getByLabelText } = render(<HealthInfoDetailScreen />);

    fireEvent.press(getByLabelText("건강 정보 확인 뒤로가기"));

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });

  it("하단 액션 버튼 클릭 시 안내 알림을 표시한다", () => {
    const { getByLabelText } = render(<HealthInfoDetailScreen />);

    fireEvent.press(getByLabelText("건강 정보 인쇄하기"));
    fireEvent.press(getByLabelText("건강 정보 공유하기"));

    expect(mockAlert).toHaveBeenCalledWith(
      "인쇄하기",
      "의료진 확인 정보를 인쇄할 수 있도록 준비 중입니다.",
    );
    expect(mockAlert).toHaveBeenCalledWith(
      "공유하기",
      "의료진 확인 정보를 공유할 수 있도록 준비 중입니다.",
    );
  });

  it("비어 있는 건강 정보는 기본값과 빈 상태를 표시한다", () => {
    mockUseHealthInfo.mockReturnValue({ allergies: [], chronicConditions: [] });
    mockUseUserStore.mockImplementation((selector: (state: { user: unknown }) => unknown) =>
      selector({
        user: {
          displayName: null,
          birthDate: null,
          gender: null,
          height: null,
          weight: null,
          bloodType: null,
        },
      }),
    );

    const { getAllByText } = render(<HealthInfoDetailScreen />);

    expect(getAllByText("-")).toHaveLength(6);
    expect(getAllByText("등록된 건강 정보가 없습니다")).toHaveLength(2);
  });

  it("지원하지 않는 성별과 혈액형은 기본 표기로 처리한다", () => {
    mockUseUserStore.mockImplementation((selector: (state: { user: unknown }) => unknown) =>
      selector({
        user: {
          displayName: "홍길동",
          birthDate: "2000-01-01",
          gender: "unknown",
          height: 170,
          weight: 60,
          bloodType: "잘못된값",
        },
      }),
    );

    const { getByText, getAllByText } = render(<HealthInfoDetailScreen />);

    expect(getByText("170 cm")).toBeTruthy();
    expect(getByText("60 kg")).toBeTruthy();
    expect(getAllByText("-")).toHaveLength(2);
  });
});
