import { render } from "@testing-library/react-native";
import type { MedicationAnalysisCardModel } from "../../types";
import { MedicationAnalysisCard } from "../MedicationAnalysisCard";

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    Text: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(Text, props, children),
    YStack: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

describe("MedicationAnalysisCard", () => {
  it("약물 분석 결과와 경고/효능/주의사항을 렌더링한다", () => {
    const medication: MedicationAnalysisCardModel = {
      atcCode: "A01",
      drugName: "타이레놀",
      riskLevel: "CAUTION",
      riskLabel: "주의",
      efficacy: ["통증 완화"],
      precautions: ["장기 복용 주의"],
      warnings: [
        {
          type: "INTERACTION",
          title: "병용 주의",
          message: "다른 해열제와 중복 복용하지 마세요.",
        },
      ],
    };

    const { getByText } = render(<MedicationAnalysisCard medication={medication} />);

    expect(getByText("주의")).toBeTruthy();
    expect(getByText("타이레놀")).toBeTruthy();
    expect(getByText("병용 주의")).toBeTruthy();
    expect(getByText("💊 효능")).toBeTruthy();
    expect(getByText("• 통증 완화")).toBeTruthy();
    expect(getByText("⚠️ 주의사항")).toBeTruthy();
    expect(getByText("• 장기 복용 주의")).toBeTruthy();
  });
});
