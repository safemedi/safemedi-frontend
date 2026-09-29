import { fireEvent, render, screen } from "@testing-library/react-native";
import type { MedicalFacility } from "../../types";
import { MedicalFacilityCard } from "../MedicalFacilityCard";

const BASE_FACILITY: MedicalFacility = {
  id: "facility-1",
  name: "강남약국",
  category: "pharmacy",
  address: "서울시 강남구 역삼동 1",
  roadAddress: "서울시 강남구 테헤란로 1",
  latitude: 37.5,
  longitude: 127.01,
  distanceMeters: 980,
  phoneNumber: "02-1234-5678",
  is24Hours: false,
  status: "unknown",
  placeUrl: null,
};

describe("MedicalFacilityCard", () => {
  it("약국 정보와 액션을 렌더링하고 콜백을 호출한다", () => {
    const handlePressCall = jest.fn();
    const handlePressDirections = jest.fn();

    render(
      <MedicalFacilityCard
        facility={BASE_FACILITY}
        onPressCall={handlePressCall}
        onPressDirections={handlePressDirections}
      />,
    );

    expect(screen.getByText("강남약국")).toBeTruthy();
    expect(screen.getByText("약국")).toBeTruthy();
    expect(screen.getByText("정보없음")).toBeTruthy();
    expect(screen.getByText("980m")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("강남약국 전화"));
    expect(handlePressCall).toHaveBeenCalledWith(BASE_FACILITY);

    fireEvent.press(screen.getByLabelText("강남약국 길찾기"));
    expect(handlePressDirections).toHaveBeenCalledWith(BASE_FACILITY);
  });

  it("응급실/24시간/영업종료 상태와 km 거리 포맷을 렌더링한다", () => {
    render(
      <MedicalFacilityCard
        facility={{
          ...BASE_FACILITY,
          category: "emergency",
          status: "closed",
          is24Hours: true,
          distanceMeters: 1200,
        }}
        onPressCall={jest.fn()}
        onPressDirections={jest.fn()}
      />,
    );

    expect(screen.getByText("응급실")).toBeTruthy();
    expect(screen.getByText("영업종료")).toBeTruthy();
    expect(screen.getByText("24시")).toBeTruthy();
    expect(screen.getByText("1.2km")).toBeTruthy();
  });

  it("roadAddress가 없으면 address를 표시한다", () => {
    render(
      <MedicalFacilityCard
        facility={{
          ...BASE_FACILITY,
          roadAddress: "",
          address: "서울시 강남구 fallback 주소",
        }}
        onPressCall={jest.fn()}
        onPressDirections={jest.fn()}
      />,
    );

    expect(screen.getByText("서울시 강남구 fallback 주소")).toBeTruthy();
  });
});
