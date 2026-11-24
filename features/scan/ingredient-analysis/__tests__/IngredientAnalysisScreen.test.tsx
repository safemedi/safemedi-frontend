import { fireEvent, render } from "@testing-library/react-native";
import type { AnalyzeIngredientsRequest, AnalyzeIngredientsResponse } from "@/api/types";
import { IngredientAnalysisScreen } from "../IngredientAnalysisScreen";
import type { IngredientAnalysisViewModel } from "../types";
import { useIngredientAnalysisViewModel } from "../useIngredientAnalysisViewModel";

const mockHandlePressRetryAnalysis = jest.fn();
const mockHandlePressCancel = jest.fn();
const mockHandlePressClose = jest.fn();
const mockHandlePressConfirm = jest.fn();

const BASE_REQUEST: AnalyzeIngredientsRequest = {
  title: "스캔 처방전",
  startDate: "2026-05-01",
  endDate: "2026-05-07",
  takeTimes: ["08:00"],
  medications: [{ drugCode: "D01", atcCode: "A01", drugName: "타이레놀", takeTimes: ["08:00"] }],
};

const BASE_RESULT: AnalyzeIngredientsResponse = {
  title: "스캔 처방전",
  analyzedMedicationCount: 1,
  summary: {
    safeCount: 1,
    cautionCount: 0,
    dangerCount: 0,
  },
  medications: [
    {
      atcCode: "A01",
      drugName: "타이레놀",
      riskLevel: "SAFE",
      efficacy: ["효능"],
      precautions: ["주의사항"],
      warnings: [],
    },
  ],
  shouldConsultDoctor: false,
  doctorConsultationMessage: null,
};

function createBaseViewModel(): IngredientAnalysisViewModel {
  return {
    request: BASE_REQUEST,
    result: BASE_RESULT,
    isAnalyzing: false,
    isSubmitting: false,
    hasMedicalStaffApproval: false,
    errorMessage: null,
    handlePressClose: mockHandlePressClose,
    handlePressBack: mockHandlePressCancel,
    handlePressRetryAnalysis: mockHandlePressRetryAnalysis,
    handlePressConfirm: mockHandlePressConfirm,
  };
}

let mockViewModel: IngredientAnalysisViewModel = createBaseViewModel();

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
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

jest.mock("../useIngredientAnalysisViewModel", () => ({
  useIngredientAnalysisViewModel: jest.fn(),
}));

jest.mock("../components/AnalysisSummaryCard", () => ({
  AnalysisSummaryCard: () => null,
}));

jest.mock("../components/DoctorConsultationCard", () => ({
  DoctorConsultationCard: ({ message }: { message: string }) => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, {}, message);
  },
}));

jest.mock("../components/MedicationAnalysisCard", () => ({
  MedicationAnalysisCard: () => null,
}));

jest.mock("../../prescription-scan/components/PrescriptionScanHeader", () => ({
  PrescriptionScanHeader: ({ onPressClose }: { onPressClose: () => void }) => {
    const React = require("react");
    const { Pressable } = require("react-native");
    return React.createElement(Pressable, {
      accessibilityLabel: "분석 닫기",
      onPress: onPressClose,
    });
  },
}));

describe("IngredientAnalysisScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockViewModel = createBaseViewModel();
    (
      useIngredientAnalysisViewModel as jest.MockedFunction<typeof useIngredientAnalysisViewModel>
    ).mockImplementation(() => mockViewModel);
  });

  it("분석 실패 상태에서 다시 시도 버튼을 누르면 재시도 핸들러를 호출한다", () => {
    mockViewModel = {
      ...mockViewModel,
      errorMessage: "네트워크 오류",
      isAnalyzing: false,
    };

    const { getByText } = render(<IngredientAnalysisScreen />);

    fireEvent.press(getByText("다시 시도"));

    expect(mockHandlePressRetryAnalysis).toHaveBeenCalledTimes(1);
  });

  it("등록 진행 중이면 하단 CTA가 로딩 문구를 노출한다", () => {
    mockViewModel = {
      ...mockViewModel,
      errorMessage: null,
      isSubmitting: true,
    };

    const { getByText, getByLabelText } = render(<IngredientAnalysisScreen />);

    expect(getByText("등록 중...")).toBeTruthy();
    expect(getByLabelText("이전 단계로 이동")).toBeDisabled();
  });

  it("분석 중이면 로딩 상태 문구를 노출한다", () => {
    mockViewModel = {
      ...mockViewModel,
      isAnalyzing: true,
      result: null,
    };

    const { getByText, getByLabelText } = render(<IngredientAnalysisScreen />);

    expect(getByText("약물 성분을 분석하는 중입니다.")).toBeTruthy();
    fireEvent.press(getByLabelText("분석 닫기"));
    expect(mockHandlePressClose).toHaveBeenCalledTimes(1);
  });

  it("분석 결과가 없으면 확정 버튼 문구를 안내 상태로 노출한다", () => {
    mockViewModel = {
      ...mockViewModel,
      result: null,
    };

    const { getByText } = render(<IngredientAnalysisScreen />);

    expect(getByText("분석 결과 필요")).toBeTruthy();
  });

  it("의료진 확인을 승인하기 전에는 의료진 확인 버튼을 노출한다", () => {
    mockViewModel = {
      ...mockViewModel,
      result: {
        ...BASE_RESULT,
        shouldConsultDoctor: true,
        doctorConsultationMessage: "전문가 상담이 필요합니다.",
      },
    };

    const { getByText } = render(<IngredientAnalysisScreen />);

    expect(getByText("의료진 확인")).toBeTruthy();
    expect(getByText("전문가 상담이 필요합니다.")).toBeTruthy();
  });

  it("의료진 확인을 승인하면 저장 버튼으로 변경한다", () => {
    mockViewModel = {
      ...mockViewModel,
      result: { ...BASE_RESULT, shouldConsultDoctor: true },
    };
    const { getByText, queryByText, rerender } = render(<IngredientAnalysisScreen />);
    expect(getByText("의료진 확인")).toBeTruthy();
    mockViewModel = { ...mockViewModel, hasMedicalStaffApproval: true };
    rerender(<IngredientAnalysisScreen />);
    expect(getByText("저장")).toBeTruthy();
    expect(queryByText("의료진 확인")).toBeNull();
  });

  it("하단 이전/확정 액션이 각 핸들러를 호출한다", () => {
    const { getByText } = render(<IngredientAnalysisScreen />);

    fireEvent.press(getByText("이전"));
    fireEvent.press(getByText("저장"));

    expect(mockHandlePressCancel).toHaveBeenCalledTimes(1);
    expect(mockHandlePressConfirm).toHaveBeenCalledTimes(1);
  });
});
