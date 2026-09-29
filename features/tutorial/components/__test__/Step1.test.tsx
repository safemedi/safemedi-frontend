import { act, fireEvent, render } from "@testing-library/react-native";
import { createRef } from "react";
import "@/tests/test-utils/test-mocks";
import { Step1 } from "@/features/tutorial/components/Step1";
import type { StepHandle } from "@/features/tutorial/types";
import type { User } from "@/stores/userStore";
import { mockUpdateUser, resetMockStore, setMockUser } from "@/tests/test-utils/test-mocks";

const referenceDate = new Date("2026-06-27T12:00:00");

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
  chronicConditions: [],
  isTutorial: false,
};

describe("튜토리얼 Step1", () => {
  beforeEach(() => {
    resetMockStore();
    jest.useFakeTimers({ now: referenceDate });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("정상 입력 시 submit이 성공하고 사용자 정보가 업데이트된다", async () => {
    setMockUser(baseUser);
    const ref = createRef<StepHandle>();
    const { getByPlaceholderText, getByLabelText } = render(<Step1 ref={ref} />);

    fireEvent.changeText(getByPlaceholderText("ex) 950101"), "000315");
    fireEvent.changeText(getByPlaceholderText("예: 170"), "171.5");
    fireEvent.changeText(getByPlaceholderText("예: 65"), "66.3");
    fireEvent.press(getByLabelText("AB형"));
    fireEvent.press(getByLabelText("Rh-"));
    fireEvent.press(getByLabelText("여성"));

    let submitted = false;
    await act(async () => {
      submitted = (await ref.current?.submit()) ?? false;
    });

    expect(submitted).toBe(true);
    expect(mockUpdateUser).toHaveBeenCalledWith({
      birthDate: "2000-03-15",
      height: 172,
      weight: 66,
      bloodType: "AB-",
      gender: "female",
    });
  });

  it("기존 birthDate가 있으면 YYMMDD 형식으로 초기값을 표시한다", () => {
    setMockUser(baseUser);
    const { getByDisplayValue } = render(<Step1 />);

    expect(getByDisplayValue("990101")).toBeTruthy();
  });

  it("필수값이 없으면 submit이 실패하고 사용자 정보를 업데이트하지 않는다", async () => {
    setMockUser(null);
    const ref = createRef<StepHandle>();
    render(<Step1 ref={ref} />);

    let submitted = true;
    await act(async () => {
      submitted = (await ref.current?.submit()) ?? false;
    });

    expect(submitted).toBe(false);
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
});
