import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useForm } from "react-hook-form";
import type { useSearchDrugsQuery } from "@/api/queries/drugs";
import { MedicationDrugSearchField } from "../components/MedicationDrugSearchField";
import type { PrescriptionScanResultFormValues } from "../usePrescriptionScanResultViewModel";

const mockUseSearchDrugsQuery = jest.fn();

jest.mock("@/api/queries/drugs", () => ({
  useSearchDrugsQuery: (...args: unknown[]) => mockUseSearchDrugsQuery(...args),
}));

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    Text: ({ children, ...props }: { readonly children: React.ReactNode }) =>
      React.createElement(Text, props, children),
    YStack: ({ children, ...props }: { readonly children: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

function TestField(props?: {
  readonly onChange?: (index: number, name: string) => void;
  readonly onSelect?: (index: number, item: unknown) => void;
}) {
  const { control } = useForm<PrescriptionScanResultFormValues>({
    defaultValues: { medications: [{ drugName: "", atcCode: "" }] },
  });
  return (
    <MedicationDrugSearchField
      index={0}
      control={control}
      onChangeMedicationName={props?.onChange ?? jest.fn()}
      onSelectMedicationDrug={props?.onSelect ?? jest.fn()}
    />
  );
}

describe("MedicationDrugSearchField", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockUseSearchDrugsQuery.mockReturnValue({
      items: [],
      isFetching: false,
      isFetchingNextPage: false,
      isError: false,
      error: null,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    } as unknown as ReturnType<typeof useSearchDrugsQuery>);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("두 글자 미만 입력은 검색을 활성화하지 않는다", () => {
    render(<TestField />);
    const input = screen.getByPlaceholderText("약물명을 한글로 입력 후 목록에서 선택");
    fireEvent(input, "focus");
    fireEvent.changeText(input, "약");
    act(() => jest.advanceTimersByTime(250));

    expect(mockUseSearchDrugsQuery).toHaveBeenLastCalledWith("약", false);
    expect(screen.queryByText("검색 결과가 없습니다.")).toBeNull();
  });

  it("검색 중·빈 결과·선택 결과를 포커스 상태에서 처리한다", () => {
    const onChange = jest.fn();
    const onSelect = jest.fn();
    const { rerender } = render(<TestField onChange={onChange} onSelect={onSelect} />);
    const input = screen.getByPlaceholderText("약물명을 한글로 입력 후 목록에서 선택");
    fireEvent(input, "focus");
    fireEvent.changeText(input, "타이");
    act(() => jest.advanceTimersByTime(250));
    expect(onChange).toHaveBeenCalledWith(0, "타이");
    expect(mockUseSearchDrugsQuery).toHaveBeenLastCalledWith("타이", true);
    expect(screen.getByText("검색 결과가 없습니다.")).toBeTruthy();

    mockUseSearchDrugsQuery.mockReturnValue({
      items: [],
      isFetching: true,
      isFetchingNextPage: false,
      isError: false,
      error: null,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    } as unknown as ReturnType<typeof useSearchDrugsQuery>);
    rerender(<TestField onChange={onChange} onSelect={onSelect} />);
    expect(screen.getByText("검색 중...")).toBeTruthy();

    const item = { drugCode: "D01", atcCode: "N02BE01", drugName: "타이레놀정", company: "한미" };
    mockUseSearchDrugsQuery.mockReturnValue({
      items: [item],
      isFetching: false,
      isFetchingNextPage: false,
      isError: false,
      error: null,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    } as unknown as ReturnType<typeof useSearchDrugsQuery>);
    rerender(<TestField onChange={onChange} onSelect={onSelect} />);
    fireEvent(screen.getByText("타이레놀정"), "pressIn");
    expect(onSelect).toHaveBeenCalledWith(0, item);
  });
});
