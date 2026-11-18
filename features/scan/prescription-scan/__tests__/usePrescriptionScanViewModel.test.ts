import { act, renderHook } from "@testing-library/react-native";
import { router } from "expo-router";
import { usePrescriptionScanViewModel } from "../usePrescriptionScanViewModel";

const mockPickImage = jest.fn();
const mockExtract = jest.fn();
const mockSetResult = jest.fn();
const mockReset = jest.fn();
const response = {
  title: "처방전",
  startDate: null,
  endDate: null,
  medications: [
    {
      drugName: "타이레놀",
      drugCode: null,
      atcCode: null,
      dailyDoseCount: 4,
      instructions: "하루 4회",
    },
  ],
};
jest.mock("expo-router", () => ({ router: { replace: jest.fn() } }));
jest.mock("../prescription-image", () => ({
  pickPrescriptionImage: (...args: unknown[]) => mockPickImage(...args),
}));
jest.mock("../usePrescriptionDraftStore", () => ({
  usePrescriptionDraftStore: (selector: (state: { setResult: typeof mockSetResult }) => unknown) =>
    selector({ setResult: mockSetResult }),
}));
jest.mock("@/api/queries/prescription-scan", () => ({
  useExtractPrescriptionMutation: () => ({ mutateAsync: mockExtract, reset: mockReset }),
}));
jest.mock("@/api/error", () => ({
  getApiErrorMessage: async (_: unknown, fallback: string) => fallback,
}));

describe("usePrescriptionScanViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPickImage.mockResolvedValue("file://prescription.jpg");
    mockExtract.mockResolvedValue(response);
  });
  it("사진을 서버로 보내고 미확인 값과 4회 복용 횟수를 보존한 초안으로 이동한다", async () => {
    const { result } = renderHook(usePrescriptionScanViewModel);
    await act(async () => {
      await result.current.extractFromGallery();
    });
    expect(mockExtract).toHaveBeenCalledWith("file://prescription.jpg");
    expect(mockSetResult).toHaveBeenCalledWith({
      imageUri: "file://prescription.jpg",
      draft: {
        title: "처방전",
        startDate: "",
        endDate: "",
        isDateRangeConfident: false,
        medications: [
          {
            drugName: "타이레놀",
            drugCode: undefined,
            atcCode: "",
            dailyDoseCount: 4,
            instructions: "하루 4회",
          },
        ],
      },
    });
    expect(router.replace).toHaveBeenCalledWith("/(detail)/scan/scan-result");
  });
  it("사진 선택 취소 시 서버에 요청하지 않는다", async () => {
    mockPickImage.mockResolvedValue(null);
    const { result } = renderHook(usePrescriptionScanViewModel);
    await act(async () => {
      await result.current.extractFromCamera();
    });
    expect(mockExtract).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });
  it("첫 업로드 실패 후 같은 사진으로 재시도할 수 있다", async () => {
    mockExtract.mockRejectedValueOnce(new Error("분석 실패"));
    const { result } = renderHook(usePrescriptionScanViewModel);
    await act(async () => {
      await result.current.extractFromGallery();
    });
    expect(result.current.error?.message).toBe("분석 실패");
    expect(router.replace).not.toHaveBeenCalled();
    await act(async () => {
      await result.current.retryExtract();
    });
    expect(mockPickImage).toHaveBeenCalledTimes(1);
    expect(mockExtract).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
  });
  it("빠르게 두 번 눌러도 한 번만 업로드한다", async () => {
    const { result } = renderHook(usePrescriptionScanViewModel);
    await act(async () => {
      await Promise.all([result.current.extractFromCamera(), result.current.extractFromGallery()]);
    });
    expect(mockExtract).toHaveBeenCalledTimes(1);
  });
  it("화면을 떠난 뒤 도착한 응답으로 이동하지 않는다", async () => {
    let resolveResponse: (value: typeof response) => void = () => {};
    mockExtract.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveResponse = resolve;
        }),
    );
    const { result, unmount } = renderHook(usePrescriptionScanViewModel);
    let pending: Promise<void> | undefined;
    await act(async () => {
      pending = result.current.extractFromGallery();
    });
    unmount();
    await act(async () => {
      resolveResponse(response);
      await pending;
    });
    expect(mockSetResult).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });
  it("직접 입력은 서버 요청 없이 빈 편집 초안으로 이동한다", () => {
    const { result } = renderHook(usePrescriptionScanViewModel);
    act(() => {
      result.current.openManualInput();
    });
    expect(mockExtract).not.toHaveBeenCalled();
    expect(mockSetResult).toHaveBeenCalledWith({
      imageUri: "manual://input",
      draft: { title: "", startDate: "", endDate: "", medications: [] },
    });
  });
});
