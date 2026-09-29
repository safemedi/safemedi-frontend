import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { SectionHeader } from "../SectionHeader";

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    Text: ({ children }: { children: React.ReactNode }) =>
      React.createElement(Text, null, children),
    XStack: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

describe("SectionHeader", () => {
  it("제목을 렌더링한다", () => {
    const { getByText } = render(<SectionHeader title="기본 제목" />);
    expect(getByText("기본 제목")).toBeTruthy();
  });

  it("icon/action을 함께 렌더링한다", () => {
    const { getByText } = render(
      <SectionHeader title="섹션" icon={<Text>아이콘</Text>} action={<Text>더보기</Text>} />,
    );

    expect(getByText("아이콘")).toBeTruthy();
    expect(getByText("섹션")).toBeTruthy();
    expect(getByText("더보기")).toBeTruthy();
  });
});
