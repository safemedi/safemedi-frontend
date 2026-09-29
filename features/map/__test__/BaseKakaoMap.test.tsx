import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";
import { BaseKakaoMap } from "../components/BaseKakaoMap";
import { MAP_MARKER_COLORS } from "../components/kakaoMapHtml";

interface MockWebViewProps {
  readonly source?: { readonly html?: string };
  readonly onMessage?: (event: { readonly nativeEvent: { readonly data: string } }) => void;
}

const mockWebView = jest.fn((_props: MockWebViewProps) => <Text>webview-map</Text>);

jest.mock("react-native-webview", () => ({
  WebView: (props: MockWebViewProps) => mockWebView(props),
}));

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: (callback: () => undefined | (() => void)) => {
    callback();
  },
}));

function restoreEnvValue(key: string, Value: string | undefined): void {
  if (Value === undefined) {
    delete process.env[key];
    return;
  }
  process.env[key] = Value;
}

describe("BaseKakaoMap", () => {
  const originalMapJsKey = process.env.EXPO_PUBLIC_KAKAO_MAP_JS_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_KAKAO_MAP_JS_KEY = "test-map-js-key";
  });

  afterEach(() => {
    restoreEnvValue("EXPO_PUBLIC_KAKAO_MAP_JS_KEY", originalMapJsKey);
  });

  it("지도 JS 키가 없으면 onMapError를 호출한다", () => {
    process.env.EXPO_PUBLIC_KAKAO_MAP_JS_KEY = "";
    const onMapError = jest.fn();

    render(
      <BaseKakaoMap
        initialRegion={{
          latitude: 37.5665,
          longitude: 126.978,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        currentCoordinate={{ latitude: 37.5665, longitude: 126.978 }}
        facilities={[]}
        onSelectFacility={jest.fn()}
        onMapError={onMapError}
      />,
    );

    expect(onMapError).toHaveBeenCalledWith("missing_map_key");
  });

  it("WebView ready 메시지를 onMapReady로 전달한다", () => {
    const onMapReady = jest.fn();
    const onSelectFacility = jest.fn();

    const { getByTestId } = render(
      <BaseKakaoMap
        initialRegion={{
          latitude: 37.5665,
          longitude: 126.978,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        currentCoordinate={{ latitude: 37.5665, longitude: 126.978 }}
        facilities={[]}
        onSelectFacility={onSelectFacility}
        onMapReady={onMapReady}
      />,
    );

    fireEvent(getByTestId("kakao-map-container"), "layout", {
      nativeEvent: { layout: { width: 320, height: 210, x: 0, y: 0 } },
    });

    const webViewProps = mockWebView.mock.calls[0][0] as MockWebViewProps;
    webViewProps.onMessage?.({
      nativeEvent: { data: JSON.stringify({ type: "ready" }) },
    });

    expect(onMapReady).toHaveBeenCalledTimes(1);
  });

  it("카카오 지도 WebView를 렌더링하고 마커 정보를 HTML에 포함한다", () => {
    const initialRegion = {
      latitude: 37.5665,
      longitude: 126.978,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    const currentCoordinate = {
      latitude: 37.5665,
      longitude: 126.978,
    };
    const facilities = [
      {
        id: "f-1",
        latitude: 37.5672,
        longitude: 126.9775,
        category: "pharmacy" as const,
      },
      {
        id: "f-2",
        latitude: 37.5681,
        longitude: 126.9792,
        category: "emergency" as const,
      },
    ];
    const onSelectFacility = jest.fn();

    const { getByTestId } = render(
      <BaseKakaoMap
        initialRegion={initialRegion}
        currentCoordinate={currentCoordinate}
        facilities={facilities}
        onSelectFacility={onSelectFacility}
      />,
    );

    fireEvent(getByTestId("kakao-map-container"), "layout", {
      nativeEvent: { layout: { width: 320, height: 210, x: 0, y: 0 } },
    });

    expect(mockWebView).toHaveBeenCalledTimes(1);
    const html = mockWebView.mock.calls[0][0].source?.html ?? "";
    expect(html).toContain("test-map-js-key");
    expect(html).toContain("map_container_zero_size");
    expect(html).toContain("handleMapCommand");
    expect(html).toContain(MAP_MARKER_COLORS.current);
    expect(html).toContain(MAP_MARKER_COLORS.pharmacy);
    expect(html).toContain(MAP_MARKER_COLORS.emergency);
    expect(html).toContain("kakao.maps.MarkerImage");
    expect(html).toContain("selectFacility");
  });

  it("지도 JS 키가 없으면 WebView를 렌더링하지 않는다", () => {
    process.env.EXPO_PUBLIC_KAKAO_MAP_JS_KEY = "";

    const { queryByText } = render(
      <BaseKakaoMap
        initialRegion={{
          latitude: 37.5665,
          longitude: 126.978,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        currentCoordinate={{ latitude: 37.5665, longitude: 126.978 }}
        facilities={[]}
        onSelectFacility={jest.fn()}
      />,
    );

    expect(queryByText("webview-map")).toBeNull();
    expect(mockWebView).not.toHaveBeenCalled();
  });
});
