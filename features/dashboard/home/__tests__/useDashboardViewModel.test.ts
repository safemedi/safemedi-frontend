import { act, renderHook } from "@testing-library/react-native";
import { Alert } from "react-native";
import {
  useDashboardTodayMedicationSchedules,
  useMarkMedicationRecordsMutation,
} from "@/api/queries/dashboard";
import { usePrescriptionsQuery } from "@/api/queries/prescriptions";
import { useDashboardViewModel } from "../useDashboardViewModel";

const mockUseDashboardTodayMedicationSchedules =
  useDashboardTodayMedicationSchedules as jest.MockedFunction<
    typeof useDashboardTodayMedicationSchedules
  >;
const mockUseMarkMedicationRecordsMutation =
  useMarkMedicationRecordsMutation as jest.MockedFunction<typeof useMarkMedicationRecordsMutation>;
const mockUsePrescriptionsQuery = usePrescriptionsQuery as jest.MockedFunction<
  typeof usePrescriptionsQuery
>;

const mockTodayRefetch = jest.fn(async () => ({}));
const mockPrescriptionsRefetch = jest.fn(async () => ({}));
const mockMutateAsync = jest.fn(async () => ({}));

jest.mock("@/api/queries/dashboard", () => ({
  useDashboardTodayMedicationSchedules: jest.fn(),
  useMarkMedicationRecordsMutation: jest.fn(),
}));
jest.mock("@/api/queries/prescriptions", () => ({
  usePrescriptionsQuery: jest.fn(),
}));
jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("useDashboardViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDashboardTodayMedicationSchedules.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: mockTodayRefetch,
    } as unknown as ReturnType<typeof useDashboardTodayMedicationSchedules>);
    mockUseMarkMedicationRecordsMutation.mockReturnValue({
      isPending: false,
      mutateAsync: mockMutateAsync,
    } as unknown as ReturnType<typeof useMarkMedicationRecordsMutation>);
    mockUsePrescriptionsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: mockPrescriptionsRefetch,
    } as unknown as ReturnType<typeof usePrescriptionsQuery>);
  });

  it("데이터가 없으면 기본값을 반환한다", () => {
    const { result } = renderHook(() => useDashboardViewModel());

    expect(result.current.adherenceRate).toBe(0);
    expect(result.current.adherenceSummaryText).toBe("0 / 0 완료");
    expect(result.current.scheduleCards).toEqual([]);
    expect(result.current.recentPrescriptions).toEqual([]);
    expect(result.current.scheduleRemainingCount).toBe(0);
  });

  it("오늘 스케줄 데이터가 있으면 카드와 최근 처방 정보를 계산한다", () => {
    mockUseDashboardTodayMedicationSchedules.mockReturnValue({
      data: {
        date: "2026-05-19",
        summary: { totalCount: 10, completedCount: 7, completionRate: 70 },
        schedules: [
          {
            takeTime: "08:00",
            prescriptionTitle: "아침약",
            prescriptionId: 1,
            drugCount: 2,
            drugNames: ["타이레놀", "오메프라졸"],
            recordIds: [1, 2],
            displayStatus: "NEED_TAKE",
          },
          {
            takeTime: "08:00",
            prescriptionTitle: "위장약",
            prescriptionId: 3,
            drugCount: 1,
            drugNames: ["판토프라졸"],
            recordIds: [4],
            displayStatus: "SUCCESS",
          },
          {
            takeTime: "20:00",
            prescriptionTitle: "저녁약",
            prescriptionId: 2,
            drugCount: 1,
            recordIds: [3],
            status: "SUCCESS",
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: mockTodayRefetch,
    } as unknown as ReturnType<typeof useDashboardTodayMedicationSchedules>);
    mockUsePrescriptionsQuery.mockReturnValue({
      data: {
        prescriptions: [
          {
            prescriptionId: 1,
            title: "아침약",
            drugCount: 2,
            hasAllergyConflict: true,
            medications: [
              {
                medicationId: 101,
                atcCode: "N02BE01",
                drugName: "타이레놀",
                takeTimes: ["08:00"],
                mainIngredient: "아세트아미노펜",
                hasWarning: false,
              },
              {
                medicationId: 102,
                atcCode: "A02BC01",
                drugName: "오메프라졸",
                takeTimes: ["08:00"],
                mainIngredient: "오메프라졸",
                hasWarning: false,
              },
            ],
          },
          {
            prescriptionId: 2,
            title: "저녁약",
            drugCount: 1,
            hasAllergyConflict: false,
            medications: [
              {
                medicationId: 201,
                atcCode: "C08CA01",
                drugName: "암로디핀",
                takeTimes: ["20:00"],
                mainIngredient: "암로디핀",
                hasWarning: false,
              },
            ],
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: mockPrescriptionsRefetch,
    } as unknown as ReturnType<typeof usePrescriptionsQuery>);

    const { result } = renderHook(() => useDashboardViewModel());

    expect(result.current.adherenceRate).toBe(70);
    expect(result.current.adherenceSummaryText).toBe("7 / 10 완료");
    expect(result.current.scheduleCards).toHaveLength(2);
    expect(result.current.scheduleCards[0]?.tone).toBe("required");
    expect(result.current.scheduleCards[0]?.scheduledTime).toBe("08:00");
    expect(result.current.scheduleCards[0]?.prescriptionCount).toBe(2);
    expect(result.current.scheduleCards[0]?.prescriptions).toEqual([
      {
        id: "1-08:00-1-2",
        prescriptionId: 1,
        prescriptionTitle: "아침약",
        medicationCount: 2,
        medicationNames: ["타이레놀", "오메프라졸"],
        recordIds: [1, 2],
        canMarkAsTaken: true,
        tone: "required",
      },
      {
        id: "3-08:00-4",
        prescriptionId: 3,
        prescriptionTitle: "위장약",
        medicationCount: 1,
        medicationNames: ["판토프라졸"],
        recordIds: [],
        canMarkAsTaken: false,
        tone: "success",
      },
    ]);
    expect(result.current.scheduleCards[1]?.statusLabel).toBe("완료");
    expect(result.current.scheduleRemainingCount).toBe(1);
    expect(result.current.recentPrescriptions[0]?.prescriptionId).toBe(1);
    expect(result.current.recentPrescriptions[0]?.dateLabel).toBe("아침약");
    expect(result.current.recentPrescriptions[0]?.analysisCount).toBe(2);
    expect(result.current.recentPrescriptions[0]?.hasWarning).toBe(true);
  });

  it("복약 가능 처방은 모든 recordId를 일괄 완료 mutation으로 처리한다", async () => {
    mockMutateAsync.mockResolvedValue([
      { status: "fulfilled", value: {} },
      { status: "fulfilled", value: {} },
    ]);
    mockUseDashboardTodayMedicationSchedules.mockReturnValue({
      data: {
        date: "2026-05-19",
        summary: { totalCount: 2, completedCount: 0, completionRate: 0 },
        schedules: [
          {
            takeTime: "08:00",
            prescriptionTitle: "아침약",
            prescriptionId: 1,
            drugCount: 2,
            drugNames: ["타이레놀", "오메프라졸"],
            recordIds: [1, 2],
            displayStatus: "NEED_TAKE",
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: mockTodayRefetch,
    } as unknown as ReturnType<typeof useDashboardTodayMedicationSchedules>);

    const { result } = renderHook(() => useDashboardViewModel());
    const prescription = result.current.scheduleCards[0]?.prescriptions[0];
    expect(prescription).toBeDefined();
    if (!prescription) return;

    await act(async () => {
      result.current.markPrescriptionAsTaken(prescription);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    expect(mockMutateAsync).toHaveBeenCalledWith({
      recordIds: [1, 2],
      body: { status: "SUCCESS" },
    });
    expect(mockTodayRefetch).not.toHaveBeenCalled();
    expect(mockPrescriptionsRefetch).not.toHaveBeenCalled();
  });

  it("약물별 스케줄 row는 같은 시간대의 처방전 단위로 병합해 한 번에 완료 처리한다", async () => {
    mockMutateAsync.mockResolvedValue([
      { status: "fulfilled", value: {} },
      { status: "fulfilled", value: {} },
    ]);
    mockUseDashboardTodayMedicationSchedules.mockReturnValue({
      data: {
        date: "2026-05-19",
        summary: { totalCount: 2, completedCount: 0, completionRate: 0 },
        schedules: [
          {
            takeTime: "08:00",
            prescriptionTitle: "감기약",
            prescriptionId: 10,
            drugCount: 1,
            drugNames: ["타이레놀"],
            recordIds: [500],
            displayStatus: "NEED_TAKE",
          },
          {
            takeTime: "08:00",
            prescriptionTitle: "감기약",
            prescriptionId: 10,
            drugCount: 1,
            drugNames: ["코푸시럽"],
            recordIds: [501],
            displayStatus: "NEED_TAKE",
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: mockTodayRefetch,
    } as unknown as ReturnType<typeof useDashboardTodayMedicationSchedules>);

    const { result } = renderHook(() => useDashboardViewModel());

    expect(result.current.scheduleCards[0]?.prescriptionCount).toBe(1);
    expect(result.current.scheduleCards[0]?.prescriptions).toEqual([
      {
        id: "10-08:00-500-501",
        prescriptionId: 10,
        prescriptionTitle: "감기약",
        medicationCount: 2,
        medicationNames: ["타이레놀", "코푸시럽"],
        recordIds: [500, 501],
        canMarkAsTaken: true,
        tone: "required",
      },
    ]);

    const prescription = result.current.scheduleCards[0]?.prescriptions[0];
    expect(prescription).toBeDefined();
    if (!prescription) return;

    await act(async () => {
      result.current.markPrescriptionAsTaken(prescription);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    expect(mockMutateAsync).toHaveBeenCalledWith({
      recordIds: [500, 501],
      body: { status: "SUCCESS" },
    });
  });

  it("일부 recordId만 실패하면 부분 실패 알림을 표시한다", async () => {
    mockMutateAsync.mockResolvedValue([
      { status: "fulfilled", value: {} },
      { status: "rejected", reason: new Error("network error") },
    ]);
    mockUseDashboardTodayMedicationSchedules.mockReturnValue({
      data: {
        date: "2026-05-19",
        summary: { totalCount: 2, completedCount: 0, completionRate: 0 },
        schedules: [
          {
            takeTime: "08:00",
            prescriptionTitle: "아침약",
            prescriptionId: 1,
            drugCount: 2,
            drugNames: ["타이레놀", "오메프라졸"],
            recordIds: [1, 2],
            displayStatus: "NEED_TAKE",
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: mockTodayRefetch,
    } as unknown as ReturnType<typeof useDashboardTodayMedicationSchedules>);

    const { result } = renderHook(() => useDashboardViewModel());
    const prescription = result.current.scheduleCards[0]?.prescriptions[0];
    expect(prescription).toBeDefined();
    if (!prescription) return;

    await act(async () => {
      result.current.markPrescriptionAsTaken(prescription);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "복약 처리 일부 실패",
      "2건 중 1건은 완료되었으나 1건에서 오류가 발생했습니다.",
    );
    expect(mockTodayRefetch).not.toHaveBeenCalled();
    expect(mockPrescriptionsRefetch).not.toHaveBeenCalled();
  });

  it("모든 recordId가 실패하면 실패 알림을 표시한다", async () => {
    mockMutateAsync.mockRejectedValue(new Error("network error"));
    mockUseDashboardTodayMedicationSchedules.mockReturnValue({
      data: {
        date: "2026-05-19",
        summary: { totalCount: 2, completedCount: 0, completionRate: 0 },
        schedules: [
          {
            takeTime: "08:00",
            prescriptionTitle: "아침약",
            prescriptionId: 1,
            drugCount: 2,
            drugNames: ["타이레놀", "오메프라졸"],
            recordIds: [1, 2],
            displayStatus: "NEED_TAKE",
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: mockTodayRefetch,
    } as unknown as ReturnType<typeof useDashboardTodayMedicationSchedules>);

    const { result } = renderHook(() => useDashboardViewModel());
    const prescription = result.current.scheduleCards[0]?.prescriptions[0];
    expect(prescription).toBeDefined();
    if (!prescription) return;

    await act(async () => {
      result.current.markPrescriptionAsTaken(prescription);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "복약 처리 실패",
      "복약 완료 처리 중 오류가 발생했습니다.",
    );
    expect(mockTodayRefetch).not.toHaveBeenCalled();
    expect(mockPrescriptionsRefetch).not.toHaveBeenCalled();
  });

  it("로딩/에러 상태를 반영하고 refetch를 병렬로 호출한다", async () => {
    mockUseDashboardTodayMedicationSchedules.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: true,
      refetch: mockTodayRefetch,
    } as unknown as ReturnType<typeof useDashboardTodayMedicationSchedules>);
    mockUsePrescriptionsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: true,
      refetch: mockPrescriptionsRefetch,
    } as unknown as ReturnType<typeof usePrescriptionsQuery>);

    const { result } = renderHook(() => useDashboardViewModel());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(true);
    await result.current.refetch();
    expect(mockTodayRefetch).toHaveBeenCalledTimes(1);
    expect(mockPrescriptionsRefetch).toHaveBeenCalledTimes(1);
  });

  it("지난 미복용 스케줄은 missed tone으로 구분한다", () => {
    mockUseDashboardTodayMedicationSchedules.mockReturnValue({
      data: {
        date: "2026-05-19",
        summary: { totalCount: 1, completedCount: 0, completionRate: 0 },
        schedules: [
          {
            takeTime: "08:00",
            prescriptionTitle: "아침약",
            prescriptionId: 1,
            drugCount: 1,
            drugNames: ["타이레놀"],
            recordIds: [1],
            displayStatus: "MISSED",
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: mockTodayRefetch,
    } as unknown as ReturnType<typeof useDashboardTodayMedicationSchedules>);

    const { result } = renderHook(() => useDashboardViewModel());

    expect(result.current.scheduleCards[0]?.statusLabel).toBe("미복용");
    expect(result.current.scheduleCards[0]?.tone).toBe("missed");
    expect(result.current.scheduleCards[0]?.prescriptions[0]?.canMarkAsTaken).toBe(false);
    expect(result.current.scheduleCards[0]?.prescriptions[0]?.tone).toBe("missed");
  });

  it("현재 복약 시간대에서 완료된 처방전은 개별 success tone으로 구분한다", () => {
    mockUseDashboardTodayMedicationSchedules.mockReturnValue({
      data: {
        date: "2026-05-19",
        summary: { totalCount: 2, completedCount: 1, completionRate: 50 },
        schedules: [
          {
            takeTime: "08:00",
            prescriptionTitle: "복용할 처방전",
            prescriptionId: 1,
            drugCount: 1,
            drugNames: ["타이레놀"],
            recordIds: [1],
            displayStatus: "NEED_TAKE",
          },
          {
            takeTime: "08:00",
            prescriptionTitle: "완료된 처방전",
            prescriptionId: 2,
            drugCount: 1,
            drugNames: ["비타민C"],
            recordIds: [],
            displayStatus: "NEED_TAKE",
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: mockTodayRefetch,
    } as unknown as ReturnType<typeof useDashboardTodayMedicationSchedules>);

    const { result } = renderHook(() => useDashboardViewModel());

    expect(result.current.scheduleCards[0]?.tone).toBe("required");
    expect(result.current.scheduleCards[0]?.prescriptions).toEqual([
      expect.objectContaining({
        prescriptionTitle: "복용할 처방전",
        canMarkAsTaken: true,
        tone: "required",
      }),
      expect.objectContaining({
        prescriptionTitle: "완료된 처방전",
        canMarkAsTaken: false,
        tone: "success",
      }),
    ]);
  });
});
