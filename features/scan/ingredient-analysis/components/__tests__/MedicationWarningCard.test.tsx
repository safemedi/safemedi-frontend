import { render } from "@testing-library/react-native";
import type { AnalysisWarningType, AnalyzeIngredientWarning } from "@/api/types";
import { MedicationWarningCard } from "../MedicationWarningCard";

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Text: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(Text, props, children),
  };
});

describe("MedicationWarningCard", () => {
  it.each([
    ["ALLERGY", "알레르기 주의"],
    ["INTERACTION", "병용 주의"],
    ["DUR_ELDERLY", "고령자 복용 주의"],
    ["DUR_AGE", "연령별 복용 주의"],
    ["DUR_PREGNANCY", "임신 중 복용 주의"],
    ["DUR_INTERACTION", "병용 주의"],
  ] satisfies [
    AnalysisWarningType,
    string,
  ][])("%s 제목이 없으면 기본 제목을 표시한다", (type, title) => {
    const { getByText } = render(
      <MedicationWarningCard warning={{ type, message: "복용 전 의료진과 상담하세요." }} />,
    );
    expect(getByText(title)).toBeTruthy();
    expect(getByText("복용 전 의료진과 상담하세요.")).toBeTruthy();
  });

  it("제목이 공백이면 기본 제목을 표시한다", () => {
    const { getByText } = render(
      <MedicationWarningCard
        warning={{ type: "DUR_AGE", title: "  ", message: "연령 확인 필요" }}
      />,
    );
    expect(getByText("연령별 복용 주의")).toBeTruthy();
  });

  it("ALLERGY 경고 내용을 렌더링한다", () => {
    const warning: AnalyzeIngredientWarning = {
      type: "ALLERGY",
      title: "알레르기 주의",
      message: "알레르기 반응 가능성이 있습니다.",
    };
    const { getByText } = render(<MedicationWarningCard warning={warning} />);

    expect(getByText("알레르기 주의")).toBeTruthy();
    expect(getByText("알레르기 반응 가능성이 있습니다.")).toBeTruthy();
  });

  it("INTERACTION 경고 내용을 렌더링한다", () => {
    const warning: AnalyzeIngredientWarning = {
      type: "INTERACTION",
      title: "병용 주의",
      message: "다른 약물과 상호작용 가능성이 있습니다.",
    };
    const { getByText } = render(<MedicationWarningCard warning={warning} />);

    expect(getByText("병용 주의")).toBeTruthy();
    expect(getByText("다른 약물과 상호작용 가능성이 있습니다.")).toBeTruthy();
  });
});
