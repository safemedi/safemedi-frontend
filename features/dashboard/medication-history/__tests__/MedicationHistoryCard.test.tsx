import { fireEvent, render } from "@testing-library/react-native";
import { MedicationHistoryCard } from "../components/MedicationHistoryCard";

const mockApprove = jest.fn();

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    Text: ({ children }: { children: React.ReactNode }) =>
      React.createElement(Text, null, children),
    YStack: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock("@/components/ui/SurfaceCard", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    SurfaceCard: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock("@/components/ui/PillButton", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    PillButton: ({
      onPress,
      children,
      accessibilityLabel,
    }: {
      onPress?: () => void;
      children: React.ReactNode;
      accessibilityLabel?: string;
    }) =>
      React.createElement(
        Pressable,
        { onPress, accessibilityLabel },
        typeof children === "string" ? React.createElement(Text, null, children) : children,
      ),
  };
});

describe("MedicationHistoryCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("safe 톤에서는 경고 영역 없이 기본 정보를 렌더링한다", () => {
    const { getByText, queryByLabelText } = render(
      <MedicationHistoryCard
        medication={{
          id: "1",
          medicationName: "타이레놀",
          scheduledTimesLabel: "09:00 복용",
          activeIngredients: ["아세트아미노펜"],
          tone: "safe",
          warningItems: [],
        }}
        onPressApprove={mockApprove}
      />,
    );

    expect(getByText("안전")).toBeTruthy();
    expect(getByText("타이레놀")).toBeTruthy();
    expect(queryByLabelText("의사 상담 후 승인 버튼")).toBeNull();
  });

  it("warning 톤에서는 경고 메시지와 승인 버튼을 노출한다", () => {
    const { getByText, getByLabelText } = render(
      <MedicationHistoryCard
        medication={{
          id: "2",
          medicationName: "주의 약물",
          scheduledTimesLabel: "20:00 복용",
          activeIngredients: ["성분A", "성분B"],
          tone: "warning",
          warningItems: [{ id: "w1", message: "알레르기 유의" }],
        }}
        onPressApprove={mockApprove}
      />,
    );

    expect(getByText("경고")).toBeTruthy();
    expect(getByText("경고 사항")).toBeTruthy();
    expect(getByText("알레르기 유의")).toBeTruthy();
    fireEvent.press(getByLabelText("의사 상담 후 승인 버튼"));
    expect(mockApprove).toHaveBeenCalledTimes(1);
  });
});
