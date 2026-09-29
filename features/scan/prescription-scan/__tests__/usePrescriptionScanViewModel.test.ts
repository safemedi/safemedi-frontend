import { act, renderHook } from "@testing-library/react-native";
import { router } from "expo-router";
import { searchDrugs } from "@/api/endpoints/drugs";
import { getApiErrorMessage } from "@/api/error";
import { useCreatePrescriptionByScanMutation } from "@/api/queries/prescription-scan";
import type { ScanPrescriptionDraft } from "../types";
import { usePrescriptionScanViewModel } from "../usePrescriptionScanViewModel";

const mockExtractDraftFromImageSource = jest.fn();
const mockExtractDraftFromImageUri = jest.fn();
const mockParsePrescriptionFromJson = jest.fn();
const mockIsPlaceholderMedication = jest.fn();
const mockMutateAsync = jest.fn();
const mockSetResult = jest.fn();
const mockSearchDrugs = searchDrugs as jest.MockedFunction<typeof searchDrugs>;

const BASE_DRAFT: ScanPrescriptionDraft = {
  title: "아침 약",
  startDate: "2026-05-01",
  endDate: "2026-05-07",
  medications: [{ atcCode: "A01", drugName: "테스트 약" }],
  rawText: "raw",
};

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock("../device-ocr", () => ({
  extractDraftFromImageSource: (...args: unknown[]) => mockExtractDraftFromImageSource(...args),
  extractDraftFromImageUri: (...args: unknown[]) => mockExtractDraftFromImageUri(...args),
}));

jest.mock("../ocr-parser", () => ({
  parsePrescriptionFromJson: (...args: unknown[]) => mockParsePrescriptionFromJson(...args),
  isPlaceholderMedication: (...args: unknown[]) => mockIsPlaceholderMedication(...args),
}));

jest.mock("@/api/endpoints/drugs", () => ({
  searchDrugs: jest.fn(),
}));

jest.mock("../usePrescriptionOcrResultStore", () => ({
  usePrescriptionOcrResultStore: (
    selector: (state: { setResult: (value: unknown) => void }) => unknown,
  ) => selector({ setResult: mockSetResult }),
}));

jest.mock("@/api/error", () => ({
  getApiErrorMessage: jest.fn(),
}));

jest.mock("@/api/queries/prescription-scan", () => ({
  useCreatePrescriptionByScanMutation: jest.fn(),
}));

describe("usePrescriptionScanViewModel", () => {
  const mockRouterReplace = router.replace as jest.MockedFunction<typeof router.replace>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPlaceholderMedication.mockReturnValue(false);
    mockSearchDrugs.mockResolvedValue({ content: [], page: 0, size: 5, isLast: true });
    (getApiErrorMessage as jest.MockedFunction<typeof getApiErrorMessage>).mockResolvedValue(
      "서버 오류",
    );
    (
      useCreatePrescriptionByScanMutation as jest.MockedFunction<
        typeof useCreatePrescriptionByScanMutation
      >
    ).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreatePrescriptionByScanMutation>);
  });

  it("갤러리 OCR 성공 시 draft를 반영하고 결과 화면으로 이동한다", async () => {
    mockExtractDraftFromImageSource.mockResolvedValue({
      draft: BASE_DRAFT,
      imageUri: "file://gallery.png",
    });

    const { result } = renderHook(() => usePrescriptionScanViewModel());

    await act(async () => {
      await result.current.extractFromGallery();
    });

    expect(result.current.draft).toEqual(BASE_DRAFT);
    expect(result.current.selectedImageUri).toBe("file://gallery.png");
    expect(mockSetResult).toHaveBeenCalledWith({
      draft: BASE_DRAFT,
      imageUri: "file://gallery.png",
    });
    expect(mockRouterReplace).toHaveBeenCalledWith("/(detail)/scan/scan-result");
  });

  it("검색 결과와 이름이 정확히 일치하는 약물이 있으면 코드를 자동으로 채운다", async () => {
    mockExtractDraftFromImageSource.mockResolvedValue({
      draft: BASE_DRAFT,
      imageUri: "file://gallery.png",
    });
    mockSearchDrugs.mockResolvedValue({
      content: [
        { drugCode: "D01", atcCode: "N02BE01", drugName: "테스트 약", company: "SAFE" },
        { drugCode: "D02", atcCode: "N02BE02", drugName: "다른 약", company: "SAFE" },
      ],
      page: 0,
      size: 5,
      isLast: true,
    });

    const { result } = renderHook(() => usePrescriptionScanViewModel());

    await act(async () => {
      await result.current.extractFromGallery();
    });

    expect(mockSearchDrugs).toHaveBeenCalledWith({ keyword: "테스트 약", size: 5 });
    expect(result.current.draft?.medications).toEqual([
      { atcCode: "N02BE01", drugName: "테스트 약", drugCode: "D01" },
    ]);
  });

  it("약물코드 자동 매칭 후에도 OCR에서 추출한 dailyDoseCount를 유지한다", async () => {
    mockExtractDraftFromImageSource.mockResolvedValue({
      draft: {
        ...BASE_DRAFT,
        medications: [{ atcCode: "A01", drugName: "테스트 약", dailyDoseCount: 2 }],
      },
      imageUri: "file://gallery.png",
    });
    mockSearchDrugs.mockResolvedValue({
      content: [{ drugCode: "D01", atcCode: "N02BE01", drugName: "테스트 약", company: "SAFE" }],
      page: 0,
      size: 5,
      isLast: true,
    });

    const { result } = renderHook(() => usePrescriptionScanViewModel());

    await act(async () => {
      await result.current.extractFromGallery();
    });

    expect(result.current.draft?.medications).toEqual([
      { atcCode: "N02BE01", drugName: "테스트 약", drugCode: "D01", dailyDoseCount: 2 },
    ]);
  });

  it("완전 일치는 없지만 제조사·용량이 붙은 이름이 있으면 포함 관계로 매칭한다", async () => {
    mockExtractDraftFromImageSource.mockResolvedValue({
      draft: BASE_DRAFT,
      imageUri: "file://gallery.png",
    });
    mockSearchDrugs.mockResolvedValue({
      content: [
        {
          drugCode: "D03",
          atcCode: "N02BE03",
          drugName: "한미약품테스트 약500mg",
          company: "한미약품",
        },
      ],
      page: 0,
      size: 5,
      isLast: true,
    });

    const { result } = renderHook(() => usePrescriptionScanViewModel());

    await act(async () => {
      await result.current.extractFromGallery();
    });

    expect(result.current.draft?.medications).toEqual([
      { atcCode: "N02BE03", drugName: "한미약품테스트 약500mg", drugCode: "D03" },
    ]);
  });

  it("포함 관계로 매칭되는 후보가 여러 개면 자동 매칭하지 않고 원본을 유지한다", async () => {
    mockExtractDraftFromImageSource.mockResolvedValue({
      draft: BASE_DRAFT,
      imageUri: "file://gallery.png",
    });
    mockSearchDrugs.mockResolvedValue({
      content: [
        {
          drugCode: "D01",
          atcCode: "N02BE01",
          drugName: "한미약품테스트 약500mg",
          company: "한미약품",
        },
        {
          drugCode: "D02",
          atcCode: "N02BE02",
          drugName: "종근당테스트 약250mg",
          company: "종근당",
        },
      ],
      page: 0,
      size: 5,
      isLast: true,
    });

    const { result } = renderHook(() => usePrescriptionScanViewModel());

    await act(async () => {
      await result.current.extractFromGallery();
    });

    expect(result.current.draft?.medications).toEqual(BASE_DRAFT.medications);
  });

  it("검색 결과에 정확히 일치하는 이름이 없으면 원본 약물명을 그대로 유지한다", async () => {
    mockExtractDraftFromImageSource.mockResolvedValue({
      draft: BASE_DRAFT,
      imageUri: "file://gallery.png",
    });
    mockSearchDrugs.mockResolvedValue({
      content: [{ drugCode: "D01", atcCode: "N02BE01", drugName: "비슷한 약", company: "SAFE" }],
      page: 0,
      size: 5,
      isLast: true,
    });

    const { result } = renderHook(() => usePrescriptionScanViewModel());

    await act(async () => {
      await result.current.extractFromGallery();
    });

    expect(result.current.draft?.medications).toEqual(BASE_DRAFT.medications);
  });

  it("미확인 약물(플레이스홀더)은 자동 검색을 시도하지 않는다", async () => {
    mockIsPlaceholderMedication.mockReturnValue(true);
    mockExtractDraftFromImageSource.mockResolvedValue({
      draft: BASE_DRAFT,
      imageUri: "file://gallery.png",
    });

    const { result } = renderHook(() => usePrescriptionScanViewModel());

    await act(async () => {
      await result.current.extractFromGallery();
    });

    expect(mockSearchDrugs).not.toHaveBeenCalled();
    expect(result.current.draft?.medications).toEqual(BASE_DRAFT.medications);
  });

  it("약물 검색이 실패해도 추출 흐름은 계속 진행된다", async () => {
    mockExtractDraftFromImageSource.mockResolvedValue({
      draft: BASE_DRAFT,
      imageUri: "file://gallery.png",
    });
    mockSearchDrugs.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => usePrescriptionScanViewModel());

    await act(async () => {
      await result.current.extractFromGallery();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.draft?.medications).toEqual(BASE_DRAFT.medications);
  });

  it("OCR 결과가 없으면 상태를 유지하고 이동하지 않는다", async () => {
    mockExtractDraftFromImageSource.mockResolvedValue(null);

    const { result } = renderHook(() => usePrescriptionScanViewModel());

    await act(async () => {
      await result.current.extractFromCamera();
    });

    expect(result.current.draft).toBeNull();
    expect(mockRouterReplace).not.toHaveBeenCalled();
    expect(mockSetResult).not.toHaveBeenCalled();
  });

  it("draft 없이 submitDraft를 호출하면 사용자 안내 에러를 설정한다", async () => {
    const { result } = renderHook(() => usePrescriptionScanViewModel());

    await act(async () => {
      await result.current.submitDraft();
    });

    expect(result.current.error?.message).toContain("등록할 스캔 결과가 없습니다");
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("재추출 대상 이미지가 없으면 retryExtract에서 에러를 설정한다", async () => {
    const { result } = renderHook(() => usePrescriptionScanViewModel());

    await act(async () => {
      await result.current.retryExtract();
    });

    expect(result.current.error?.message).toContain("재시도할 이미지가 없습니다");
  });

  it("잘못된 수동 JSON 적용 시 에러를 노출한다", async () => {
    mockParsePrescriptionFromJson.mockImplementation(() => {
      throw new Error("JSON 파싱 실패");
    });

    const { result } = renderHook(() => usePrescriptionScanViewModel());

    await act(async () => {
      result.current.updateManualJson("{ broken");
      result.current.applyManualJson();
    });

    expect(result.current.error?.message).toBe("JSON 파싱 실패");
  });

  it("수동 입력 열기 후 submit 실패 시 API 에러 메시지를 사용한다", async () => {
    mockMutateAsync.mockRejectedValue(new Error("request failed"));

    const { result } = renderHook(() => usePrescriptionScanViewModel());

    await act(async () => {
      result.current.openManualInput();
    });

    await act(async () => {
      await result.current.submitDraft();
    });

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    expect(result.current.error?.message).toBe("서버 오류");
  });
});
