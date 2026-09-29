import { fireEvent, render } from "@testing-library/react-native";
import { router } from "expo-router";
import { Alert } from "react-native";
import { PrescriptionScanScreen } from "../PrescriptionScanScreen";
import type { PrescriptionScanViewModel } from "../types";

const mockUsePrescriptionScanViewModel = jest.fn<PrescriptionScanViewModel, []>();
const mockExtractFromGallery = jest.fn<Promise<void>, []>(async () => {});
const mockExtractFromCamera = jest.fn<Promise<void>, []>(async () => {});
const mockRetryExtract = jest.fn<Promise<void>, []>(async () => {});
const mockOpenManualInput = jest.fn();
const mockCloseManualInput = jest.fn();
const mockUpdateManualJson = jest.fn();
const mockApplyManualJson = jest.fn();
const mockResetError = jest.fn();
const mockResetSubmitFeedback = jest.fn();

jest.mock("expo-router", () => ({
  __esModule: true,
  router: {
    replace: jest.fn(),
  },
}));

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

jest.mock("../usePrescriptionScanViewModel", () => ({
  usePrescriptionScanViewModel: () => mockUsePrescriptionScanViewModel(),
}));

jest.mock("../components/PrescriptionScanHeader", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    PrescriptionScanHeader: ({ onPressClose }: { onPressClose: () => void }) =>
      React.createElement(
        Pressable,
        { onPress: onPressClose, accessibilityRole: "button", accessibilityLabel: "닫기 버튼" },
        React.createElement(Text, null, "헤더"),
      ),
  };
});

jest.mock("../components/PrescriptionFrameCard", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    PrescriptionFrameCard: ({
      onPressManualInput,
    }: {
      imageUri: string | null;
      onPressManualInput: () => void;
    }) =>
      React.createElement(
        Pressable,
        {
          onPress: onPressManualInput,
          accessibilityRole: "button",
          accessibilityLabel: "직접 입력 열기",
        },
        React.createElement(Text, null, "프레임"),
      ),
  };
});

jest.mock("../components/PrescriptionScanActions", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    PrescriptionScanActions: ({
      onPressGallery,
      onPressCamera,
    }: {
      isBusy: boolean;
      onPressGallery: () => void;
      onPressCamera: () => void;
    }) =>
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          Pressable,
          {
            onPress: onPressGallery,
            accessibilityRole: "button",
            accessibilityLabel: "갤러리 버튼",
          },
          React.createElement(Text, null, "갤러리"),
        ),
        React.createElement(
          Pressable,
          { onPress: onPressCamera, accessibilityRole: "button", accessibilityLabel: "촬영 버튼" },
          React.createElement(Text, null, "촬영"),
        ),
      ),
  };
});

function createViewModel(
  overrides?: Partial<PrescriptionScanViewModel>,
): PrescriptionScanViewModel {
  return {
    draft: null,
    draftJson: "{}",
    isExtracting: false,
    isSubmitting: false,
    isManualInputVisible: false,
    error: null,
    submitFeedback: null,
    selectedImageUri: null,
    extractFromGallery: mockExtractFromGallery,
    extractFromCamera: mockExtractFromCamera,
    submitDraft: jest.fn(async () => {}),
    retryExtract: mockRetryExtract,
    openManualInput: mockOpenManualInput,
    closeManualInput: mockCloseManualInput,
    updateManualJson: mockUpdateManualJson,
    applyManualJson: mockApplyManualJson,
    resetError: mockResetError,
    resetSubmitFeedback: mockResetSubmitFeedback,
    ...overrides,
  };
}

describe("PrescriptionScanScreen", () => {
  const mockRouterReplace = router.replace as jest.MockedFunction<typeof router.replace>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePrescriptionScanViewModel.mockReturnValue(createViewModel());
  });

  it("닫기 버튼 클릭 시 대시보드 탭으로 이동한다", () => {
    const { getByLabelText } = render(<PrescriptionScanScreen />);
    fireEvent.press(getByLabelText("닫기 버튼"));
    expect(mockRouterReplace).toHaveBeenCalledWith("/(tabs)/dashboard");
  });

  it("갤러리/촬영 버튼 클릭 시 viewModel 핸들러를 호출한다", () => {
    const { getByLabelText } = render(<PrescriptionScanScreen />);
    fireEvent.press(getByLabelText("갤러리 버튼"));
    fireEvent.press(getByLabelText("촬영 버튼"));
    expect(mockExtractFromGallery).toHaveBeenCalledTimes(1);
    expect(mockExtractFromCamera).toHaveBeenCalledTimes(1);
  });

  it("직접 입력 버튼 클릭 시 viewModel 핸들러를 호출한다", () => {
    const { getByLabelText } = render(<PrescriptionScanScreen />);
    fireEvent.press(getByLabelText("직접 입력 열기"));
    expect(mockOpenManualInput).toHaveBeenCalledTimes(1);
  });

  it("error 상태면 Alert를 노출한다", () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    mockUsePrescriptionScanViewModel.mockReturnValue(
      createViewModel({
        error: new Error("OCR 실패"),
      }),
    );

    render(<PrescriptionScanScreen />);

    expect(alertSpy).toHaveBeenCalledWith(
      "처방전 스캔 오류",
      "OCR 실패",
      expect.arrayContaining([expect.objectContaining({ text: "확인" })]),
    );
    alertSpy.mockRestore();
  });
});
