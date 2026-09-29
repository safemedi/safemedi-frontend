import { fireEvent, render } from "@testing-library/react-native";
import { Alert } from "react-native";
import { usePrescriptionOcrResultStore } from "../../prescription-scan/usePrescriptionOcrResultStore";
import { PrescriptionScanResultScreen } from "../PrescriptionScanResultScreen";

jest.mock("expo-router", () => ({
  __esModule: true,
  router: {
    back: jest.fn(),
    replace: jest.fn(),
    push: jest.fn(),
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("@react-native-community/datetimepicker", () => {
  const React = require("react");
  const { View } = require("react-native");
  const MockPicker = ({ children }: { readonly children?: React.ReactNode }) =>
    React.createElement(View, null, children);
  return {
    __esModule: true,
    default: MockPicker,
    DateTimePickerAndroid: {
      open: jest.fn(),
    },
  };
});

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

const mockMutateAsync = jest.fn();

jest.mock("@/api/queries/prescription-scan", () => ({
  useCreatePrescriptionByScanMutation: () => ({
    isPending: false,
    mutateAsync: mockMutateAsync,
  }),
}));

jest.mock("@/api/queries/drugs", () => ({
  useSearchDrugsQuery: () => ({
    data: [],
    isFetching: false,
  }),
}));

jest.mock("@/api/error", () => ({
  parseApiError: jest.fn(async () => ({ message: "error" })),
}));

describe("PrescriptionScanResultScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePrescriptionOcrResultStore.setState({ result: null });
  });

  it("OCR 결과가 없으면 스캔 화면으로 리다이렉트한다", () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    render(<PrescriptionScanResultScreen />);
    expect(alertSpy).toHaveBeenCalledWith(
      "스캔 결과 없음",
      "복약 등록 정보가 없습니다. 스캔 화면으로 이동합니다.",
      expect.arrayContaining([expect.objectContaining({ text: "확인" })]),
    );
    alertSpy.mockRestore();
  });

  it("OCR 결과가 있으면 복약 등록 폼과 약물 목록을 노출한다", () => {
    usePrescriptionOcrResultStore.setState({
      result: {
        imageUri: "file://prescription.jpg",
        draft: {
          title: "처방전",
          startDate: "2026-05-14",
          endDate: "2026-05-20",
          medications: [{ atcCode: "UNKNOWN", drugName: "아세트아미노펜정" }],
          rawText: "아세트아미노펜정 500mg",
        },
      },
    });

    const { getByText } = render(<PrescriptionScanResultScreen />);
    expect(getByText("복약 등록")).toBeTruthy();
    expect(getByText("인식된 약물")).toBeTruthy();
    expect(getByText("아세트아미노펜정")).toBeTruthy();
    expect(getByText("검색 결과에서 약물을 선택해야 등록됩니다.")).toBeTruthy();
  });

  it("약물 코드가 정상 매칭되면 코드를 노출한다", () => {
    usePrescriptionOcrResultStore.setState({
      result: {
        imageUri: "file://prescription.jpg",
        draft: {
          title: "처방전",
          startDate: "2026-05-14",
          endDate: "2026-05-20",
          medications: [{ atcCode: "N02BE01", drugName: "타이레놀정", drugCode: "195700007" }],
          rawText: "타이레놀정 500mg",
        },
      },
    });

    const { getByText, queryByText } = render(<PrescriptionScanResultScreen />);
    expect(getByText("약물 코드: N02BE01")).toBeTruthy();
    expect(queryByText("검색 결과에서 약물을 선택해야 등록됩니다.")).toBeNull();
  });

  it("약물을 인식하지 못했으면 저신뢰 안내 배너를 노출한다", () => {
    usePrescriptionOcrResultStore.setState({
      result: {
        imageUri: "file://prescription.jpg",
        draft: {
          title: "처방전",
          startDate: "2026-05-14",
          endDate: "2026-05-20",
          medications: [{ atcCode: "UNKNOWN", drugName: "미확인 약물" }],
          rawText: "인식 실패",
        },
      },
    });

    const { getByText, queryByText } = render(<PrescriptionScanResultScreen />);
    expect(getByText("약물을 정확히 인식하지 못했어요")).toBeTruthy();
    expect(queryByText("텍스트 인식 완료!")).toBeNull();
  });

  it("약물 추가 버튼 클릭 시 약물 입력 카드가 추가된다", () => {
    usePrescriptionOcrResultStore.setState({
      result: {
        imageUri: "file://prescription.jpg",
        draft: {
          title: "처방전",
          startDate: "2026-05-14",
          endDate: "2026-05-20",
          medications: [{ atcCode: "UNKNOWN", drugName: "아세트아미노펜정" }],
          rawText: "아세트아미노펜정 500mg",
        },
      },
    });

    const { getByLabelText, getByText } = render(<PrescriptionScanResultScreen />);
    fireEvent.press(getByLabelText("약물 추가"));
    expect(getByText("약물 2")).toBeTruthy();
  });
});
