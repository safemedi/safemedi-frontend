import { render } from "@testing-library/react-native";
import { ActivityIndicator } from "react-native";

import { palette } from "@/constants/design-tokens";
import { LoadingSpinner } from "../LoadingSpinner";

describe("LoadingSpinner", () => {
  it("기본 로딩 스피너는 로그인 화면 기준 색상과 크기를 사용한다", () => {
    const { UNSAFE_getByType } = render(<LoadingSpinner />);

    const spinner = UNSAFE_getByType(ActivityIndicator);
    expect(spinner.props.color).toBe(palette.blue);
    expect(spinner.props.size).toBe("large");
  });

  it("필요한 경우 크기와 접근성 라벨을 지정할 수 있다", () => {
    const { getByLabelText, UNSAFE_getByType } = render(
      <LoadingSpinner size="small" accessibilityLabel="목록 로딩 중" />,
    );

    expect(getByLabelText("목록 로딩 중")).toBeTruthy();
    expect(UNSAFE_getByType(ActivityIndicator).props.size).toBe("small");
  });
});
