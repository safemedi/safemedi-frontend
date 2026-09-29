import { renderHook } from "@testing-library/react-native";
import { usePrescriptionQuery } from "@/api/queries/prescriptions";
import { useMedicationHistoryViewModel } from "../useMedicationHistoryViewModel";

const mockUsePrescriptionQuery = usePrescriptionQuery as jest.MockedFunction<
  typeof usePrescriptionQuery
>;
const mockRefetch = jest.fn(async () => ({}));

jest.mock("@/api/queries/prescriptions", () => ({
  usePrescriptionQuery: jest.fn(),
}));

describe("useMedicationHistoryViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePrescriptionQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof usePrescriptionQuery>);
  });

  it("기본 상태에서 빈 데이터와 기본 날짜 라벨을 제공한다", () => {
    const { result } = renderHook(() => useMedicationHistoryViewModel(undefined));

    expect(result.current.displayDate).toBe("-");
    expect(result.current.warningSummary).toBeNull();
    expect(result.current.medications).toEqual([]);
  });

  it("기록 데이터를 가공해 medication 아이템과 경고 요약을 만든다", () => {
    mockUsePrescriptionQuery.mockReturnValue({
      data: {
        prescriptionId: 11,
        title: "신장내과 처방전",
        startDate: "2026-05-19",
        medications: [
          {
            medicationId: 1,
            atcCode: "N02BE01",
            drugName: "A",
            takeTimes: ["09:00"],
            mainIngredient: "B",
            hasWarning: true,
            warningMessage: "주의 필요",
          },
          {
            medicationId: 2,
            atcCode: "A02BC01",
            drugName: "C",
            takeTimes: ["20:00"],
            mainIngredient: "C",
            hasWarning: false,
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof usePrescriptionQuery>);

    const { result } = renderHook(() => useMedicationHistoryViewModel("11"));

    expect(result.current.displayDate).not.toBe("-");
    expect(result.current.warningSummary).toContain("경고");
    expect(result.current.medications[0]?.tone).toBe("warning");
    expect(result.current.medications[0]?.activeIngredients).toEqual(["B"]);
    expect(result.current.medications[1]?.tone).toBe("safe");
  });

  it("경고 메시지가 없는 주의 약물에는 기본 경고 문구를 생성한다", () => {
    mockUsePrescriptionQuery.mockReturnValue({
      data: {
        prescriptionId: 11,
        title: "신장내과 처방전",
        medications: [
          {
            medicationId: 5,
            atcCode: "N02BE01",
            drugName: "A",
            takeTimes: ["13:00"],
            mainIngredient: "A",
            hasWarning: true,
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof usePrescriptionQuery>);

    const { result } = renderHook(() => useMedicationHistoryViewModel("11"));

    expect(result.current.medications[0]?.warningItems[0]?.message).toContain("주의가 필요한 약물");
  });
});
