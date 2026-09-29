import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { useEffect } from "react";
import { Linking, Pressable, Text } from "react-native";
import { MapScreen } from "../MapScreen";
import type { MedicalFacility } from "../types";
import type { MapViewModel } from "../useMapViewModel";

interface MockBaseKakaoMapProps {
  readonly initialRegion: MapViewModel["initialRegion"];
  readonly currentCoordinate: MapViewModel["currentCoordinate"];
  readonly facilities: readonly {
    readonly id: string;
    readonly latitude: number;
    readonly longitude: number;
    readonly category: "pharmacy" | "emergency";
  }[];
  readonly onSelectFacility: (facilityId: string | null) => void;
  readonly onMapReady?: () => void;
  readonly onMapError?: (errorCode: string) => void;
}

interface MockMedicalFacilityCardProps {
  readonly facility: MedicalFacility;
  readonly onPressCall: (facility: MedicalFacility) => Promise<void>;
  readonly onPressDirections: (facility: MedicalFacility) => Promise<void>;
}

function MockBaseKakaoMapComponent(props: MockBaseKakaoMapProps) {
  useEffect(() => {
    props.onMapReady?.();
  }, [props.onMapReady]);

  return <Text>map</Text>;
}

const mockBaseKakaoMap = jest.fn((props: MockBaseKakaoMapProps) => {
  return <MockBaseKakaoMapComponent {...props} />;
});
const mockMedicalFacilityCard = jest.fn((props: MockMedicalFacilityCardProps) => {
  return (
    <>
      <Text>{props.facility.name}</Text>
      <Pressable onPress={() => void props.onPressCall(props.facility)}>
        <Text>{`${props.facility.id}-call`}</Text>
      </Pressable>
      <Pressable onPress={() => void props.onPressDirections(props.facility)}>
        <Text>{`${props.facility.id}-directions`}</Text>
      </Pressable>
    </>
  );
});

const mockUseMapViewModel = jest.fn();
const mockOpenUrl = jest.fn();

jest.mock("../useMapViewModel", () => ({
  useMapViewModel: () => mockUseMapViewModel(),
}));

jest.mock("../components/BaseKakaoMap", () => ({
  BaseKakaoMap: (props: MockBaseKakaoMapProps) => mockBaseKakaoMap(props),
}));

jest.mock("../components/MedicalFacilityCard", () => ({
  MedicalFacilityCard: (props: MockMedicalFacilityCardProps) => mockMedicalFacilityCard(props),
}));

jest.mock("@/components/ui/SelectChip", () => ({
  SelectChip: ({ label, onPress }: { readonly label: string; readonly onPress: () => void }) => {
    const { Pressable: LocalPressable, Text: LocalText } = require("react-native");
    return (
      <LocalPressable onPress={onPress}>
        <LocalText>{label}</LocalText>
      </LocalPressable>
    );
  },
}));

jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
jest.spyOn(Linking, "openURL").mockImplementation((url: string) => {
  mockOpenUrl(url);
  return Promise.resolve(true);
});

const BASE_FACILITY: MedicalFacility = {
  id: "facility-1",
  name: "서울약국",
  category: "pharmacy",
  address: "서울시 강남구 역삼동",
  roadAddress: "서울시 강남구 테헤란로",
  latitude: 37.5,
  longitude: 127.01,
  distanceMeters: 150,
  phoneNumber: "02-1234-5678",
  is24Hours: true,
  status: "open",
  placeUrl: "https://place.map.kakao.com/mock",
};

const BASE_VIEW_MODEL: MapViewModel = {
  isLoadingLocation: false,
  isLoadingFacilities: false,
  isRefreshingFacilities: false,
  locationError: null,
  facilitiesError: null,
  source: "mock",
  currentAddress: "서울 강남구",
  currentCoordinate: { latitude: 37.5, longitude: 127.01 },
  initialRegion: {
    latitude: 37.5,
    longitude: 127.01,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  },
  isUsingDevFallbackLocation: false,
  category: "all",
  inputKeyword: "",
  searchKeyword: "",
  selectedFacilityId: "facility-1",
  facilities: [BASE_FACILITY],
  setCategory: jest.fn(),
  setInputKeyword: jest.fn(),
  submitSearch: jest.fn(),
  setSelectedFacilityId: jest.fn(),
  retryLocation: jest.fn(),
  refetchFacilities: jest.fn(async () => {}),
};

describe("MapScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMapViewModel.mockReturnValue(BASE_VIEW_MODEL);
    mockBaseKakaoMap.mockImplementation((props: MockBaseKakaoMapProps) => {
      return <MockBaseKakaoMapComponent {...props} />;
    });
  });

  it("위치 로딩 중 상태를 렌더링한다", () => {
    mockUseMapViewModel.mockReturnValue({
      ...BASE_VIEW_MODEL,
      isLoadingLocation: true,
    });

    render(<MapScreen />);

    expect(screen.getByText("현재 위치를 불러오는 중이에요.")).toBeTruthy();
  });

  it("위치 정보가 없으면 에러 메시지를 렌더링한다", () => {
    mockUseMapViewModel.mockReturnValue({
      ...BASE_VIEW_MODEL,
      initialRegion: null,
      currentCoordinate: null,
      locationError: "위치 확인 실패",
    });

    render(<MapScreen />);

    expect(screen.getByText("위치 확인 실패")).toBeTruthy();
    expect(screen.getByText("위치 다시 시도")).toBeTruthy();
  });

  it("지도 로딩 중에는 본문을 표시하지 않는다", () => {
    mockBaseKakaoMap.mockImplementation(() => {
      return <Text>map</Text>;
    });
    mockUseMapViewModel.mockReturnValue({
      ...BASE_VIEW_MODEL,
      facilities: [],
    });

    render(<MapScreen />);

    expect(screen.getByText("주변 의료기관 지도를 불러오는 중이에요.")).toBeTruthy();
    expect(screen.queryByText("주변 의료기관")).toBeNull();
    expect(screen.queryByText("0개 의료기관")).toBeNull();
  });

  it("목록 조회 중에는 기존 본문을 유지하고 목록 로딩만 표시한다", async () => {
    mockUseMapViewModel.mockReturnValue({
      ...BASE_VIEW_MODEL,
      isLoadingFacilities: true,
    });

    render(<MapScreen />);

    await waitFor(() => {
      expect(screen.getByText("주변 의료기관")).toBeTruthy();
    });
    expect(screen.getByText("1개 의료기관")).toBeTruthy();
    expect(screen.queryByText("주변 의료기관 지도를 불러오는 중이에요.")).toBeNull();
  });

  it("지도 로딩에 실패하면 에러 메시지를 렌더링한다", () => {
    mockBaseKakaoMap.mockImplementation((_props: MockBaseKakaoMapProps) => {
      return <Text>map</Text>;
    });

    render(<MapScreen />);

    const mapProps = mockBaseKakaoMap.mock.calls[0][0] as MockBaseKakaoMapProps;
    act(() => {
      mapProps.onMapError?.("map_init_timeout");
    });

    expect(screen.getByText("지도 로딩 시간이 초과되었습니다.")).toBeTruthy();
    expect(screen.getByText("지도 다시 시도")).toBeTruthy();
    expect(screen.queryByText("주변 의료기관")).toBeNull();
  });

  it("정상 상태에서 목록을 렌더링하고 검색/카테고리/액션을 처리한다", async () => {
    render(<MapScreen />);

    await waitFor(() => {
      expect(screen.getByText("주변 의료기관")).toBeTruthy();
    });
    expect(screen.getByText("1개 의료기관")).toBeTruthy();

    const searchInput = screen.getByPlaceholderText("약국, 병원 검색...");
    fireEvent.changeText(searchInput, "강남");
    expect(BASE_VIEW_MODEL.setInputKeyword).toHaveBeenCalledWith("강남");

    fireEvent(searchInput, "submitEditing");
    expect(BASE_VIEW_MODEL.submitSearch).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByText("응급실"));
    expect(BASE_VIEW_MODEL.setCategory).toHaveBeenCalledWith("emergency");

    const mapProps = mockBaseKakaoMap.mock.calls[0][0] as MockBaseKakaoMapProps;
    expect(mapProps.facilities[0]).toEqual(
      expect.objectContaining({
        id: "facility-1",
        category: "pharmacy",
      }),
    );

    fireEvent.press(screen.getByText("facility-1-call"));
    await waitFor(() => {
      expect(mockOpenUrl).toHaveBeenCalledWith("tel:02-1234-5678");
    });

    fireEvent.press(screen.getByText("facility-1-directions"));
    await waitFor(() => {
      expect(mockOpenUrl).toHaveBeenCalledWith("https://place.map.kakao.com/mock");
    });
  });

  it("전화번호가 없으면 전화 링크를 열지 않는다", async () => {
    mockUseMapViewModel.mockReturnValue({
      ...BASE_VIEW_MODEL,
      facilities: [{ ...BASE_FACILITY, id: "facility-2", phoneNumber: null }],
    });

    render(<MapScreen />);

    await waitFor(() => {
      expect(screen.getByText("facility-2-call")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("facility-2-call"));
    expect(mockOpenUrl).not.toHaveBeenCalled();
  });

  it("개발용 위치, 목록 갱신, 목록 오류를 함께 표시한다", async () => {
    mockUseMapViewModel.mockReturnValue({
      ...BASE_VIEW_MODEL,
      isUsingDevFallbackLocation: true,
      isRefreshingFacilities: true,
      facilitiesError: "network",
    });

    render(<MapScreen />);

    await waitFor(() => {
      expect(
        screen.getByText("실제 GPS를 받지 못해 개발용 기본 위치를 사용 중입니다."),
      ).toBeTruthy();
    });
    expect(screen.getByText("목록을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.")).toBeTruthy();
  });

  it("외부 링크를 열 수 없으면 전화와 길찾기를 실행하지 않는다", async () => {
    jest.mocked(Linking.canOpenURL).mockResolvedValueOnce(false).mockResolvedValueOnce(false);
    render(<MapScreen />);
    await waitFor(() => expect(screen.getByText("facility-1-call")).toBeTruthy());

    fireEvent.press(screen.getByText("facility-1-call"));
    fireEvent.press(screen.getByText("facility-1-directions"));

    await waitFor(() => expect(Linking.canOpenURL).toHaveBeenCalledTimes(2));
    expect(mockOpenUrl).not.toHaveBeenCalled();
  });
});
