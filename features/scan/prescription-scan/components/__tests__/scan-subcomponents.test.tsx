import { fireEvent, render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { PrescriptionFrameCard } from "../PrescriptionFrameCard";
import { PrescriptionScanActions } from "../PrescriptionScanActions";

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Text: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(Text, props, children),
  };
});

describe("prescription scan subcomponents", () => {
  it("PrescriptionFrameCard는 직접 입력 버튼 이벤트를 전달한다", () => {
    const onPressManualInput = jest.fn();
    const { getByText, rerender } = render(
      <PrescriptionFrameCard imageUri={null} onPressManualInput={onPressManualInput} />,
    );

    fireEvent.press(getByText("📝 직접 입력하기"));
    expect(onPressManualInput).toHaveBeenCalledTimes(1);

    rerender(
      <PrescriptionFrameCard
        imageUri="file://sample.png"
        onPressManualInput={onPressManualInput}
      />,
    );
    expect(getByText("처방전을 가이드 라인 안에 맞춰주세요")).toBeTruthy();
  });

  it("PrescriptionScanActions는 갤러리/촬영 액션을 전달한다", () => {
    const onPressGallery = jest.fn();
    const onPressCamera = jest.fn();
    const { getByLabelText, rerender } = render(
      <PrescriptionScanActions
        isBusy={false}
        onPressGallery={onPressGallery}
        onPressCamera={onPressCamera}
        bottomInset={0}
      />,
    );

    fireEvent.press(getByLabelText("갤러리"));
    fireEvent.press(getByLabelText("촬영하기"));
    expect(onPressGallery).toHaveBeenCalledTimes(1);
    expect(onPressCamera).toHaveBeenCalledTimes(1);

    rerender(
      <PrescriptionScanActions
        isBusy
        onPressGallery={onPressGallery}
        onPressCamera={onPressCamera}
        bottomInset={0}
      />,
    );
    fireEvent.press(getByLabelText("갤러리"));
    expect(onPressGallery).toHaveBeenCalledTimes(1);
  });

  it("PrescriptionScanActions는 bottomInset이 최소 여백보다 크면 그대로 반영한다", () => {
    const { getByTestId } = render(
      <PrescriptionScanActions
        isBusy={false}
        onPressGallery={jest.fn()}
        onPressCamera={jest.fn()}
        bottomInset={34}
      />,
    );

    const container = getByTestId("prescription-scan-actions");
    expect(StyleSheet.flatten(container.props.style).paddingBottom).toBe(34);
  });

  it("PrescriptionScanActions는 bottomInset이 최소 여백보다 작으면 최소 여백을 사용한다", () => {
    const { getByTestId } = render(
      <PrescriptionScanActions
        isBusy={false}
        onPressGallery={jest.fn()}
        onPressCamera={jest.fn()}
        bottomInset={0}
      />,
    );

    const container = getByTestId("prescription-scan-actions");
    expect(StyleSheet.flatten(container.props.style).paddingBottom).toBe(12);
  });
});
