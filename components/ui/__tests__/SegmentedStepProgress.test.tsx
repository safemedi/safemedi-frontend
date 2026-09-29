import { render } from "@testing-library/react-native";
import { SegmentedStepProgress } from "../SegmentedStepProgress";

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    Text: ({ children }: { children: React.ReactNode }) =>
      React.createElement(Text, null, children),
    XStack: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    YStack: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

describe("SegmentedStepProgress", () => {
  it("totalSteps가 0이면 아무것도 렌더링하지 않는다", () => {
    const { toJSON } = render(<SegmentedStepProgress currentIndex={0} totalSteps={0} />);
    expect(toJSON()).toBeNull();
  });

  it("기본 라벨을 렌더링하고 currentIndex 범위를 보정한다", () => {
    const { getByText, rerender } = render(
      <SegmentedStepProgress currentIndex={10} totalSteps={4} />,
    );
    expect(getByText("4 / 4")).toBeTruthy();

    rerender(<SegmentedStepProgress currentIndex={-2} totalSteps={4} />);
    expect(getByText("1 / 4")).toBeTruthy();
  });

  it("showLabel=false일 때 라벨을 숨긴다", () => {
    const { queryByText } = render(
      <SegmentedStepProgress currentIndex={1} totalSteps={3} showLabel={false} px={12} />,
    );
    expect(queryByText("2 / 3")).toBeNull();
  });
});
