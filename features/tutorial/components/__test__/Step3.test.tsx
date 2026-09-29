import { act, fireEvent, render } from "@testing-library/react-native";
import { createRef } from "react";
import "@/tests/test-utils/test-mocks";
import type { useSearchDiseasesQuery } from "@/api/queries/health-profile";
import { Step3 } from "@/features/tutorial/components/Step3";
import type { StepHandle } from "@/features/tutorial/types";
import type { User } from "@/stores/userStore";
import { mockUpdateUser, resetMockStore, setMockUser } from "@/tests/test-utils/test-mocks";

const baseUser: User = {
  id: "me",
  displayName: "사용자",
  email: null,
  birthDate: "1999-01-01",
  height: 170,
  weight: 65,
  gender: "male",
  bloodType: "O+",
  allergies: [],
  chronicConditions: ["천식"],
  isTutorial: false,
};

const mockUseSearchDiseasesQuery = jest.fn();

jest.mock("@/api/queries/health-profile", () => ({
  useSearchDiseasesQuery: (...args: unknown[]) => mockUseSearchDiseasesQuery(...args),
}));

describe("튜토리얼 Step3", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    resetMockStore();
    mockUseSearchDiseasesQuery.mockReturnValue({
      items: [],
      isFetching: false,
      isFetchingNextPage: false,
      isError: false,
      error: null,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    } as unknown as ReturnType<typeof useSearchDiseasesQuery>);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("선택 가능한 기저질환만 저장하고 submit이 성공한다", async () => {
    setMockUser({ ...baseUser, chronicConditions: ["천식", "편두통"] });
    const ref = createRef<StepHandle>();
    const { getByLabelText, getByPlaceholderText } = render(<Step3 ref={ref} />);

    fireEvent.press(getByLabelText("고혈압"));

    let submitted = false;
    await act(async () => {
      submitted = (await ref.current?.submit()) ?? false;
    });

    expect(submitted).toBe(true);
    expect(getByPlaceholderText("기저질환명 검색")).toBeTruthy();
    expect(mockUpdateUser).toHaveBeenCalledWith({
      chronicConditions: ["천식", "고혈압", "편두통"],
      chronicConditionMappings: {},
    });
  });

  it("검색으로 선택한 기저질환은 코드 매핑과 함께 저장한다", async () => {
    mockUseSearchDiseasesQuery.mockReturnValue({
      items: [{ diseaseCode: "G43", diseaseName: "편두통" }],
      isFetching: false,
      isFetchingNextPage: false,
      isError: false,
      error: null,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    } as unknown as ReturnType<typeof useSearchDiseasesQuery>);
    setMockUser({ ...baseUser, chronicConditions: ["천식"] });
    const ref = createRef<StepHandle>();
    const { getByPlaceholderText, getByLabelText } = render(<Step3 ref={ref} />);

    fireEvent.changeText(getByPlaceholderText("기저질환명 검색"), "편두");
    act(() => jest.advanceTimersByTime(250));
    fireEvent.press(getByLabelText("편두통 검색 결과 선택"));

    let submitted = false;
    await act(async () => {
      submitted = (await ref.current?.submit()) ?? false;
    });

    expect(submitted).toBe(true);
    expect(mockUpdateUser).toHaveBeenCalledWith({
      chronicConditions: ["천식", "편두통"],
      chronicConditionMappings: { 편두통: "G43" },
    });
  });
});
