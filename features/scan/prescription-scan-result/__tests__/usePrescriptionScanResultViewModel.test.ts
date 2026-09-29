import { act, renderHook } from "@testing-library/react-native";
import { router } from "expo-router";
import { Alert } from "react-native";
import type { DrugSearchItem } from "@/api/types";
import type { PrescriptionOcrResult } from "../../prescription-scan/usePrescriptionOcrResultStore";
import { usePrescriptionScanResultViewModel } from "../usePrescriptionScanResultViewModel";

const mockClearResult = jest.fn();
const mockSetIngredientAnalysisRequest = jest.fn();

let mockResult: PrescriptionOcrResult | null = {
  imageUri: "file://image.png",
  draft: {
    title: "스캔 처방전",
    startDate: "2026-05-01",
    endDate: "2026-05-07",
    medications: [{ atcCode: "A01", drugName: "타이레놀" }],
    rawText: "타이레놀",
  },
};

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock("../../prescription-scan/usePrescriptionOcrResultStore", () => ({
  usePrescriptionOcrResultStore: (
    selector: (state: { result: PrescriptionOcrResult | null; clearResult: () => void }) => unknown,
  ) =>
    selector({
      result: mockResult,
      clearResult: mockClearResult,
    }),
}));

jest.mock("../../ingredient-analysis/useIngredientAnalysisStore", () => ({
  useIngredientAnalysisStore: (
    selector: (state: {
      request: null;
      setRequest: (payload: unknown) => void;
      clearRequest: () => void;
    }) => unknown,
  ) =>
    selector({
      request: null,
      setRequest: mockSetIngredientAnalysisRequest,
      clearRequest: jest.fn(),
    }),
}));

describe("usePrescriptionScanResultViewModel", () => {
  const mockRouterReplace = router.replace as jest.MockedFunction<typeof router.replace>;
  const mockAlert = jest.spyOn(Alert, "alert").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    mockResult = {
      imageUri: "file://image.png",
      draft: {
        title: "스캔 처방전",
        startDate: "2026-05-01",
        endDate: "2026-05-07",
        medications: [{ atcCode: "A01", drugName: "타이레놀" }],
        rawText: "타이레놀",
      },
    };
  });

  afterAll(() => {
    mockAlert.mockRestore();
  });

  it("결과가 없으면 스캔 화면으로 이동 알림을 노출한다", () => {
    mockResult = null;

    renderHook(() => usePrescriptionScanResultViewModel());

    expect(mockAlert).toHaveBeenCalledWith(
      "스캔 결과 없음",
      "복약 등록 정보가 없습니다. 스캔 화면으로 이동합니다.",
      expect.any(Array),
    );
  });

  it("약물 추가/수정 관련 핸들러가 폼 상태를 갱신한다", async () => {
    const { result } = renderHook(() => usePrescriptionScanResultViewModel());

    await act(async () => {
      result.current.handlePressAddMedication();
    });
    expect(result.current.fields).toHaveLength(2);
    expect(result.current.editingMedicationIndex).toBe(1);

    const selectedDrug: DrugSearchItem = {
      drugCode: "D01",
      atcCode: "N02BE01",
      drugName: "아세트아미노펜",
      company: "SAFE",
    };
    await act(async () => {
      result.current.handleSelectMedicationDrug(1, selectedDrug);
      result.current.handleToggleMedicationTakeSlot(1, "DINNER");
      result.current.handlePressCompleteMedicationEdit();
    });

    expect(result.current.editingMedicationIndex).toBeNull();
  });

  it("약물명을 직접 변경하면 ATC 코드가 초기화되어 분석 시 안내 알림을 띄운다", async () => {
    const { result } = renderHook(() => usePrescriptionScanResultViewModel());

    await act(async () => {
      result.current.handleSelectPrescriptionDate("startDate", new Date(2026, 4, 1));
      result.current.handleSelectPrescriptionDate("endDate", new Date(2026, 4, 7));
      result.current.handleChangeMedicationName(0, "직접입력약");
      result.current.handleToggleMedicationTakeSlot(0, "MORNING");
      await result.current.handlePressAnalyze();
    });

    expect(mockAlert).toHaveBeenCalledWith("입력 확인", "약물명은 검색 결과에서 선택해야 합니다.");
    expect(mockSetIngredientAnalysisRequest).not.toHaveBeenCalled();
  });

  it("유효한 입력이면 성분 분석 요청을 저장하고 결과 화면으로 이동한다", async () => {
    const { result } = renderHook(() => usePrescriptionScanResultViewModel());

    await act(async () => {
      result.current.handleSelectPrescriptionDate("startDate", new Date(2026, 4, 3));
      result.current.handleSelectPrescriptionDate("endDate", new Date(2026, 4, 10));
      result.current.handleSelectMedicationDrug(0, {
        drugCode: "D01",
        atcCode: "A01",
        drugName: "타이레놀",
      });
      result.current.handleToggleMedicationTakeSlot(0, "MORNING");
      await result.current.handlePressAnalyze();
    });

    expect(mockSetIngredientAnalysisRequest).toHaveBeenCalledWith({
      title: "스캔 처방전",
      startDate: "2026-05-03",
      endDate: "2026-05-10",
      takeTimes: ["08:00"],
      medications: [
        {
          drugCode: "D01",
          atcCode: "A01",
          drugName: "타이레놀",
          takeTimes: ["08:00"],
        },
      ],
    });
    expect(mockRouterReplace).toHaveBeenCalledWith("/(detail)/scan/ingredient-analysis");
  });

  it("초기 복약 기간은 빈값이며 날짜 선택 전에는 분석 버튼이 비활성화 상태다", () => {
    const { result } = renderHook(() => usePrescriptionScanResultViewModel());

    expect(result.current.startDate).toBe("");
    expect(result.current.endDate).toBe("");
    expect(result.current.startDateLabel).toBe("날짜를 선택해주세요");
    expect(result.current.endDateLabel).toBe("날짜를 선택해주세요");
    expect(result.current.isAnalyzeDisabled).toBe(true);
  });

  it("복약 기간이 신뢰 가능하면 OCR 추출 날짜를 그대로 초기값으로 사용한다", () => {
    mockResult = {
      imageUri: "file://image.png",
      draft: {
        title: "스캔 처방전",
        startDate: "2026-07-14",
        endDate: "2026-07-19",
        medications: [{ atcCode: "A01", drugName: "타이레놀" }],
        rawText: "타이레놀",
        isDateRangeConfident: true,
      },
    };

    const { result } = renderHook(() => usePrescriptionScanResultViewModel());

    expect(result.current.startDate).toBe("2026-07-14");
    expect(result.current.endDate).toBe("2026-07-19");
  });

  it("dailyDoseCount가 3이면 아침/점심/저녁을 자동으로 선택한다", () => {
    mockResult = {
      imageUri: "file://image.png",
      draft: {
        title: "스캔 처방전",
        startDate: "2026-05-01",
        endDate: "2026-05-07",
        medications: [{ atcCode: "A01", drugName: "타이레놀", dailyDoseCount: 3 }],
        rawText: "타이레놀",
      },
    };

    const { result } = renderHook(() => usePrescriptionScanResultViewModel());

    expect(result.current.fields[0]).toMatchObject({
      takeSlots: ["MORNING", "LUNCH", "DINNER"],
    });
  });

  it("dailyDoseCount가 2이면 아침/저녁을 자동으로 선택한다", () => {
    mockResult = {
      imageUri: "file://image.png",
      draft: {
        title: "스캔 처방전",
        startDate: "2026-05-01",
        endDate: "2026-05-07",
        medications: [{ atcCode: "A01", drugName: "타이레놀", dailyDoseCount: 2 }],
        rawText: "타이레놀",
      },
    };

    const { result } = renderHook(() => usePrescriptionScanResultViewModel());

    expect(result.current.fields[0]).toMatchObject({
      takeSlots: ["MORNING", "DINNER"],
    });
  });

  it("dailyDoseCount가 1이면 아침만 자동으로 선택한다", () => {
    mockResult = {
      imageUri: "file://image.png",
      draft: {
        title: "스캔 처방전",
        startDate: "2026-05-01",
        endDate: "2026-05-07",
        medications: [{ atcCode: "A01", drugName: "타이레놀", dailyDoseCount: 1 }],
        rawText: "타이레놀",
      },
    };

    const { result } = renderHook(() => usePrescriptionScanResultViewModel());

    expect(result.current.fields[0]).toMatchObject({
      takeSlots: ["MORNING"],
    });
  });

  it("draft에 drugCode가 포함되어 있으면 초기값으로 사용한다", () => {
    mockResult = {
      imageUri: "file://image.png",
      draft: {
        title: "스캔 처방전",
        startDate: "2026-05-01",
        endDate: "2026-05-07",
        medications: [{ atcCode: "N02BE01", drugName: "타이레놀", drugCode: "D01" }],
        rawText: "타이레놀",
      },
    };

    const { result } = renderHook(() => usePrescriptionScanResultViewModel());

    expect(result.current.fields[0]).toMatchObject({ drugCode: "D01" });
  });

  it("복약 시작일/종료일을 선택하면 분석 버튼 비활성화가 해제된다", async () => {
    const { result } = renderHook(() => usePrescriptionScanResultViewModel());

    await act(async () => {
      result.current.handleSelectPrescriptionDate("startDate", new Date(2026, 4, 1));
      result.current.handleSelectPrescriptionDate("endDate", new Date(2026, 4, 7));
    });

    expect(result.current.isAnalyzeDisabled).toBe(false);
  });

  it("복약 종료일이 시작일보다 빠르면 분석 시 안내 알림을 노출한다", async () => {
    const { result } = renderHook(() => usePrescriptionScanResultViewModel());

    await act(async () => {
      result.current.handleSelectPrescriptionDate("startDate", new Date(2026, 4, 10));
      result.current.handleSelectPrescriptionDate("endDate", new Date(2026, 4, 3));
      result.current.handleToggleMedicationTakeSlot(0, "MORNING");
      await result.current.handlePressAnalyze();
    });

    expect(mockAlert).toHaveBeenCalledWith(
      "입력 확인",
      "복약 종료일은 시작일보다 빠를 수 없습니다.",
    );
    expect(mockSetIngredientAnalysisRequest).not.toHaveBeenCalled();
  });

  it("복약 시간을 선택하지 않으면 약물별 선택 안내 알림을 노출한다", async () => {
    const { result } = renderHook(() => usePrescriptionScanResultViewModel());

    await act(async () => {
      result.current.handleSelectPrescriptionDate("startDate", new Date(2026, 4, 3));
      result.current.handleSelectPrescriptionDate("endDate", new Date(2026, 4, 10));
      result.current.handleSelectMedicationDrug(0, {
        drugCode: "D01",
        atcCode: "A01",
        drugName: "타이레놀",
      });
      await result.current.handlePressAnalyze();
    });

    expect(mockAlert).toHaveBeenCalledWith(
      "입력 확인",
      "각 약물마다 복약 시간을 최소 1개 선택해주세요.",
    );
    expect(mockSetIngredientAnalysisRequest).not.toHaveBeenCalled();
  });

  it("처방전 제목이 비어 있으면 분석 시 제목 입력 안내 알림을 노출한다", async () => {
    mockResult = {
      imageUri: "file://image.png",
      draft: {
        title: "   ",
        startDate: "2026-05-01",
        endDate: "2026-05-07",
        medications: [{ atcCode: "A01", drugName: "타이레놀" }],
        rawText: "타이레놀",
      },
    };
    const { result } = renderHook(() => usePrescriptionScanResultViewModel());

    await act(async () => {
      result.current.handleSelectPrescriptionDate("startDate", new Date(2026, 4, 3));
      result.current.handleSelectPrescriptionDate("endDate", new Date(2026, 4, 10));
      result.current.handleToggleMedicationTakeSlot(0, "MORNING");
      await result.current.handlePressAnalyze();
    });

    expect(mockAlert).toHaveBeenCalledWith("입력 확인", "처방전 제목을 입력해주세요.");
    expect(mockSetIngredientAnalysisRequest).not.toHaveBeenCalled();
  });

  it("편집 중인 뒤쪽 약물을 삭제하면 편집 인덱스를 앞으로 보정한다", async () => {
    const { result } = renderHook(() => usePrescriptionScanResultViewModel());

    await act(async () => {
      result.current.handlePressAddMedication();
      result.current.handlePressAddMedication();
      result.current.handlePressEditMedication(2);
    });
    expect(result.current.editingMedicationIndex).toBe(2);

    await act(async () => {
      result.current.handlePressRemoveMedication(0);
    });

    expect(result.current.fields).toHaveLength(2);
    expect(result.current.editingMedicationIndex).toBe(1);
  });

  it("수동 입력 모드 이미지면 isManualInputMode를 true로 반환한다", () => {
    mockResult = {
      imageUri: "manual://capture.png",
      draft: {
        title: "수기 입력",
        startDate: "",
        endDate: "",
        medications: [{ atcCode: "A01", drugName: "타이레놀" }],
        rawText: "",
      },
    };

    const { result } = renderHook(() => usePrescriptionScanResultViewModel());

    expect(result.current.isManualInputMode).toBe(true);
  });

  it("약물을 인식하지 못했으면 저신뢰 결과로 판별한다", () => {
    mockResult = {
      imageUri: "file://image.png",
      draft: {
        title: "스캔 처방전",
        startDate: "2026-05-01",
        endDate: "2026-05-07",
        medications: [{ atcCode: "UNKNOWN", drugName: "미확인 약물" }],
        rawText: "인식 실패",
      },
    };

    const { result } = renderHook(() => usePrescriptionScanResultViewModel());

    expect(result.current.hasLowConfidenceExtraction).toBe(true);
  });

  it("약물을 정상 인식했으면 저신뢰 결과가 아니다", () => {
    const { result } = renderHook(() => usePrescriptionScanResultViewModel());

    expect(result.current.hasLowConfidenceExtraction).toBe(false);
  });

  it("다시 스캔하기를 누르면 결과를 비우고 스캔 화면으로 이동한다", async () => {
    const { result } = renderHook(() => usePrescriptionScanResultViewModel());

    await act(async () => {
      result.current.handlePressRetryScan();
    });

    expect(mockClearResult).toHaveBeenCalledTimes(1);
    expect(mockRouterReplace).toHaveBeenCalledWith("/(detail)/scan/scan");
  });
});
