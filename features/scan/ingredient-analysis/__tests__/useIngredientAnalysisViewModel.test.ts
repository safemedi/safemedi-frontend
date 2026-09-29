import { act, renderHook, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import { Alert } from "react-native";
import { getApiErrorMessage } from "@/api/error";
import { useAnalyzeIngredientsMutation } from "@/api/queries/ingredient-analysis";
import { useCreatePrescriptionByScanMutation } from "@/api/queries/prescription-scan";
import type { AnalyzeIngredientsRequest, AnalyzeIngredientsResponse } from "@/api/types";
import { useIngredientAnalysisViewModel } from "../useIngredientAnalysisViewModel";

const mockClearRequest = jest.fn();
const mockClearOcrResult = jest.fn();
const mockAnalyzeMutateAsync = jest.fn();
const mockCreateMutateAsync = jest.fn();

let mockRequest: AnalyzeIngredientsRequest | null = null;

const BASE_REQUEST: AnalyzeIngredientsRequest = {
  title: "스캔 처방전",
  startDate: "2026-05-01",
  endDate: "2026-05-07",
  takeTimes: ["08:00"],
  medications: [{ drugCode: "D01", atcCode: "A01", drugName: "타이레놀", takeTimes: ["08:00"] }],
};

const BASE_ANALYSIS_RESPONSE: AnalyzeIngredientsResponse = {
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

function createDeferred<T>() {
  let resolvePromise: (value: T) => void = () => {};
  let rejectPromise: (reason?: unknown) => void = () => {};
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  return {
    promise,
    resolve: resolvePromise,
    reject: rejectPromise,
  };
}

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    back: jest.fn(),
  },
}));

jest.mock("@/api/error", () => ({
  getApiErrorMessage: jest.fn(),
}));

jest.mock("@/api/queries/ingredient-analysis", () => ({
  useAnalyzeIngredientsMutation: jest.fn(),
}));

jest.mock("@/api/queries/prescription-scan", () => ({
  useCreatePrescriptionByScanMutation: jest.fn(),
}));

jest.mock("../../prescription-scan/usePrescriptionOcrResultStore", () => ({
  usePrescriptionOcrResultStore: (selector: (state: { clearResult: () => void }) => unknown) =>
    selector({
      clearResult: mockClearOcrResult,
    }),
}));

jest.mock("../useIngredientAnalysisStore", () => ({
  useIngredientAnalysisStore: (
    selector: (state: {
      request: AnalyzeIngredientsRequest | null;
      clearRequest: () => void;
    }) => unknown,
  ) =>
    selector({
      request: mockRequest,
      clearRequest: mockClearRequest,
    }),
}));

describe("useIngredientAnalysisViewModel", () => {
  const mockRouterReplace = router.replace as jest.MockedFunction<typeof router.replace>;
  const mockRouterBack = router.back as jest.MockedFunction<typeof router.back>;
  const mockAlert = jest.spyOn(Alert, "alert").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = BASE_REQUEST;

    (
      useAnalyzeIngredientsMutation as jest.MockedFunction<typeof useAnalyzeIngredientsMutation>
    ).mockReturnValue({
      mutateAsync: mockAnalyzeMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAnalyzeIngredientsMutation>);

    (
      useCreatePrescriptionByScanMutation as jest.MockedFunction<
        typeof useCreatePrescriptionByScanMutation
      >
    ).mockReturnValue({
      mutateAsync: mockCreateMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreatePrescriptionByScanMutation>);

    (getApiErrorMessage as jest.MockedFunction<typeof getApiErrorMessage>).mockResolvedValue(
      "네트워크 오류",
    );
  });

  afterAll(() => {
    mockAlert.mockRestore();
  });

  it("request가 없으면 스캔 결과 화면 이동 안내 알림을 띄운다", () => {
    mockRequest = null;

    renderHook(() => useIngredientAnalysisViewModel());

    expect(mockAlert).toHaveBeenCalledWith(
      "성분 분석 정보 없음",
      "분석할 약물 정보가 없습니다. 스캔 결과 화면으로 이동합니다.",
      expect.arrayContaining([expect.objectContaining({ text: "확인" })]),
    );
  });

  it("초기 분석 성공 시 result를 설정한다", async () => {
    const deferred = createDeferred<AnalyzeIngredientsResponse>();
    mockAnalyzeMutateAsync.mockReturnValueOnce(deferred.promise);

    const { result } = renderHook(() => useIngredientAnalysisViewModel());
    expect(mockAnalyzeMutateAsync).toHaveBeenCalledWith(BASE_REQUEST);

    await act(async () => {
      deferred.resolve(BASE_ANALYSIS_RESPONSE);
      await deferred.promise;
    });

    await waitFor(() => {
      expect(result.current.result).toEqual(BASE_ANALYSIS_RESPONSE);
      expect(result.current.errorMessage).toBeNull();
    });
  });

  it("초기 분석 실패 시 errorMessage를 설정하고 재시도에서 복구한다", async () => {
    const deferred = createDeferred<AnalyzeIngredientsResponse>();
    mockAnalyzeMutateAsync.mockReturnValueOnce(deferred.promise);

    const { result } = renderHook(() => useIngredientAnalysisViewModel());
    expect(mockAnalyzeMutateAsync).toHaveBeenCalledWith(BASE_REQUEST);

    await act(async () => {
      deferred.reject(new Error("network down"));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe("네트워크 오류");
    });

    mockAnalyzeMutateAsync.mockResolvedValueOnce(BASE_ANALYSIS_RESPONSE);
    await act(async () => {
      await result.current.handlePressRetryAnalysis();
    });

    expect(mockAnalyzeMutateAsync).toHaveBeenCalledTimes(2);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.result).toEqual(BASE_ANALYSIS_RESPONSE);
  });

  it("복약 등록 성공 시 확인 액션에서 상태를 정리하고 대시보드로 이동한다", async () => {
    const deferred = createDeferred<AnalyzeIngredientsResponse>();
    mockAnalyzeMutateAsync.mockReturnValueOnce(deferred.promise);
    mockCreateMutateAsync.mockResolvedValue({
      message: "등록 완료",
      hasAllergyConflict: false,
      allergyWarnings: [],
    });

    const { result } = renderHook(() => useIngredientAnalysisViewModel());

    await act(async () => {
      deferred.resolve(BASE_ANALYSIS_RESPONSE);
      await deferred.promise;
    });

    await waitFor(() => {
      expect(result.current.result).toEqual(BASE_ANALYSIS_RESPONSE);
    });

    await act(async () => {
      await result.current.handlePressConfirm();
    });

    expect(mockAlert).toHaveBeenCalledWith("복약 등록 완료", "등록 완료", expect.any(Array));

    const alertButtons = mockAlert.mock.calls.at(-1)?.[2];
    const confirmButton = alertButtons?.[0];
    expect(confirmButton?.text).toBe("확인");

    await act(async () => {
      confirmButton?.onPress?.();
    });

    expect(mockClearRequest).toHaveBeenCalledTimes(1);
    expect(mockClearOcrResult).toHaveBeenCalledTimes(1);
    expect(mockRouterReplace).toHaveBeenCalledWith("/(tabs)/dashboard");
  });

  it("알레르기 충돌이 있으면 경고 타이틀과 상세 메시지로 알림을 노출한다", async () => {
    mockAnalyzeMutateAsync.mockResolvedValueOnce(BASE_ANALYSIS_RESPONSE);
    mockCreateMutateAsync.mockResolvedValue({
      message: "알레르기 충돌 감지",
      hasAllergyConflict: true,
      allergyWarnings: [
        {
          atcCode: "A01",
          drugName: "타이레놀",
          conflictWith: "peanut",
          warningMessage: "땅콩 알레르기 유발 가능성",
        },
      ],
    });

    const { result } = renderHook(() => useIngredientAnalysisViewModel());

    await waitFor(() => {
      expect(result.current.result).toEqual(BASE_ANALYSIS_RESPONSE);
    });

    await act(async () => {
      await result.current.handlePressConfirm();
    });

    expect(mockAlert).toHaveBeenCalledWith(
      "알레르기 주의",
      "알레르기 충돌 감지\n땅콩 알레르기 유발 가능성",
      expect.any(Array),
    );
  });

  it("복약 등록 실패 시 오류 알림을 노출한다", async () => {
    mockAnalyzeMutateAsync.mockResolvedValueOnce(BASE_ANALYSIS_RESPONSE);
    mockCreateMutateAsync.mockRejectedValueOnce(new Error("submit failed"));
    (getApiErrorMessage as jest.MockedFunction<typeof getApiErrorMessage>).mockResolvedValueOnce(
      "등록 중 오류가 발생했습니다.",
    );

    const { result } = renderHook(() => useIngredientAnalysisViewModel());

    await waitFor(() => {
      expect(result.current.result).toEqual(BASE_ANALYSIS_RESPONSE);
    });

    await act(async () => {
      await result.current.handlePressConfirm();
    });

    expect(mockAlert).toHaveBeenCalledWith("복약 등록 실패", "등록 중 오류가 발생했습니다.");
  });

  it("닫기 버튼 핸들러는 request를 비우고 대시보드로 이동한다", () => {
    const { result } = renderHook(() => useIngredientAnalysisViewModel());

    act(() => {
      result.current.handlePressClose();
    });

    expect(mockClearRequest).toHaveBeenCalledTimes(1);
    expect(mockRouterReplace).toHaveBeenCalledWith("/(tabs)/dashboard");
  });

  it("request가 없으면 재시도와 확정 핸들러는 mutation을 호출하지 않는다", async () => {
    mockRequest = null;
    const { result } = renderHook(() => useIngredientAnalysisViewModel());

    await act(async () => {
      await result.current.handlePressRetryAnalysis();
      await result.current.handlePressConfirm();
    });

    expect(mockAnalyzeMutateAsync).not.toHaveBeenCalled();
    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
  });

  it("분석 mutation이 pending이면 초기 분석을 시작하지 않는다", () => {
    (
      useAnalyzeIngredientsMutation as jest.MockedFunction<typeof useAnalyzeIngredientsMutation>
    ).mockReturnValue({
      mutateAsync: mockAnalyzeMutateAsync,
      isPending: true,
    } as unknown as ReturnType<typeof useAnalyzeIngredientsMutation>);

    renderHook(() => useIngredientAnalysisViewModel());

    expect(mockAnalyzeMutateAsync).not.toHaveBeenCalled();
  });

  it("취소 버튼 핸들러는 back 라우팅을 호출한다", () => {
    const { result } = renderHook(() => useIngredientAnalysisViewModel());

    act(() => {
      result.current.handlePressCancel();
    });

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });
});
