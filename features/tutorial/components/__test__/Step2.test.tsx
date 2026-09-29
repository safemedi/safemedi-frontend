import { act, fireEvent, render } from "@testing-library/react-native";
import { createRef } from "react";
import "@/tests/test-utils/test-mocks";
import type { useSearchDrugAllergiesQuery } from "@/api/queries/health-profile";
import { Step2 } from "@/features/tutorial/components/Step2";
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
  allergies: ["페니실린"],
  chronicConditions: [],
  isTutorial: false,
};

const mockUseSearchDrugAllergiesQuery = jest.fn();

jest.mock("@/api/queries/health-profile", () => ({
  useSearchDrugAllergiesQuery: (...args: unknown[]) => mockUseSearchDrugAllergiesQuery(...args),
}));

describe("튜토리얼 Step2", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    resetMockStore();
    mockUseSearchDrugAllergiesQuery.mockReturnValue({
      items: [],
      isFetching: false,
      isFetchingNextPage: false,
      isError: false,
      error: null,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    } as unknown as ReturnType<typeof useSearchDrugAllergiesQuery>);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("선택 알러지와 검색 선택 알러지를 저장하고 submit이 성공한다", async () => {
    const searchedDrug = {
      allergyType: "ATC_GROUP",
      allergyValue: "J01C",
      allergyName: "페니실린류 베타락탐계 항박테리아제",
    };
    mockUseSearchDrugAllergiesQuery.mockReturnValue({
      items: [searchedDrug],
      isFetching: false,
      isFetchingNextPage: false,
      isError: false,
      error: null,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    } as unknown as ReturnType<typeof useSearchDrugAllergiesQuery>);
    setMockUser(baseUser);
    const ref = createRef<StepHandle>();
    const { getByPlaceholderText, getByLabelText } = render(<Step2 ref={ref} />);

    fireEvent.press(getByLabelText("기타 진통제 및 해열제"));
    fireEvent.changeText(getByPlaceholderText("알러지 약물명 검색"), "아목");
    act(() => jest.advanceTimersByTime(250));
    fireEvent.press(getByLabelText("페니실린류 베타락탐계 항박테리아제 검색 결과 선택"));

    let submitted = false;
    await act(async () => {
      submitted = (await ref.current?.submit()) ?? false;
    });

    expect(submitted).toBe(true);
    expect(mockUpdateUser).toHaveBeenCalledWith({
      allergies: ["기타 진통제 및 해열제", "페니실린", "페니실린류 베타락탐계 항박테리아제"],
      allergyMappings: {
        "페니실린류 베타락탐계 항박테리아제": {
          type: "ATC_GROUP",
          value: "J01C",
          name: "페니실린류 베타락탐계 항박테리아제",
        },
      },
    });
  });
});
