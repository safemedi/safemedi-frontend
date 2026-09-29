import { fireEvent, render } from "@testing-library/react-native";
import { AuthGateView } from "../AuthGateView";

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Text: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(Text, props, children),
  };
});

describe("AuthGateView", () => {
  it("loading 상태에서는 인디케이터만 노출한다", () => {
    const { queryByText } = render(<AuthGateView kind="loading" />);

    expect(queryByText("다시 시도")).toBeNull();
  });

  it("error 상태에서는 메시지와 재시도·로그아웃 버튼을 노출한다", () => {
    const onRetry = jest.fn();
    const onLogout = jest.fn();
    const { getByText, getByLabelText } = render(
      <AuthGateView kind="error" onRetry={onRetry} onLogout={onLogout} />,
    );

    expect(getByText("사용자 정보를 불러오지 못했습니다.")).toBeTruthy();
    fireEvent.press(getByLabelText("사용자 정보 다시 시도"));
    expect(onRetry).toHaveBeenCalledTimes(1);
    fireEvent.press(getByLabelText("로그아웃"));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
