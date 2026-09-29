import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { SurfaceCard } from "../SurfaceCard";

describe("SurfaceCard", () => {
  it("children을 렌더링한다", () => {
    const { getByText } = render(
      <SurfaceCard>
        <Text>카드 내용</Text>
      </SurfaceCard>,
    );

    expect(getByText("카드 내용")).toBeTruthy();
  });

  it("style prop을 허용한다", () => {
    const { getByText } = render(
      <SurfaceCard style={{ padding: 12 }}>
        <Text>패딩 카드</Text>
      </SurfaceCard>,
    );

    expect(getByText("패딩 카드")).toBeTruthy();
  });
});
