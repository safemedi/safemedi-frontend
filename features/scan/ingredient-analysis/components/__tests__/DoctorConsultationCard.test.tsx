import { render } from "@testing-library/react-native";
import { DoctorConsultationCard } from "../DoctorConsultationCard";

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Text: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(Text, props, children),
  };
});

describe("DoctorConsultationCard", () => {
  it("고정 타이틀과 전달된 메시지를 렌더링한다", () => {
    const { getByText } = render(
      <DoctorConsultationCard message="병용 위험이 있어 상담이 필요합니다." />,
    );

    expect(getByText("의사 상담 필수")).toBeTruthy();
    expect(getByText("병용 위험이 있어 상담이 필요합니다.")).toBeTruthy();
  });
});
