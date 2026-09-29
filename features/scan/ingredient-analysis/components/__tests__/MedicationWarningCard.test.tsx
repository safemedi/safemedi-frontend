import { render } from "@testing-library/react-native";
import type { AnalyzeIngredientWarning } from "@/api/types";
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
