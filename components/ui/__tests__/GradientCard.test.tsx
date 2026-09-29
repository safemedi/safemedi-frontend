import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { GradientCard } from "../GradientCard";

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LinearGradient: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

describe("GradientCard", () => {
  it("children을 렌더링한다", () => {
    const { getByText } = render(
      <GradientCard gradientColors={["#111111", "#222222"]}>
        <Text>그라디언트 카드</Text>
      </GradientCard>,
    );

    expect(getByText("그라디언트 카드")).toBeTruthy();
  });

  it("3개 이상 gradient color도 허용한다", () => {
    const { getByText } = render(
      <GradientCard
        gradientColors={["#111111", "#222222", "#333333"]}
        gradientLocations={[0, 0.5, 1]}
      >
        <Text>다중 색상</Text>
      </GradientCard>,
    );

    expect(getByText("다중 색상")).toBeTruthy();
  });
});
