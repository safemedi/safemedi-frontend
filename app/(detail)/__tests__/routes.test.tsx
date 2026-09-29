import { render } from "@testing-library/react-native";
import DetailLayout from "../_layout";
import MedicationHistoryRoute from "../dashboard/medication-history";
import FamilyManageDetailRoute from "../family/manage";
import ProfileEditRoute from "../profile/edit";
import HealthInfoDetailRoute from "../profile/health-info";
import ScanDetailRoute from "../scan/scan";
import ScanResultDetailRoute from "../scan/scan-result";

const mockStack = jest.fn((_props: unknown) => null);
const mockMedicationHistoryScreen = jest.fn(() => null);
const mockFamilyManageScreen = jest.fn(() => null);
const mockProfileEditScreen = jest.fn(() => null);
const mockHealthInfoDetailScreen = jest.fn(() => null);
const mockPrescriptionScanResultScreen = jest.fn(() => null);
const mockPrescriptionScanScreen = jest.fn(() => null);

jest.mock("expo-router", () => {
  const React = require("react");
  return {
    Stack: (props: unknown) => {
      mockStack(props);
      return React.createElement("View", {});
    },
  };
});

jest.mock("@/features/dashboard/medication-history", () => ({
  MedicationHistoryScreen: () => mockMedicationHistoryScreen(),
}));

jest.mock("@/features/family/invite", () => ({
  FamilyManageScreen: () => mockFamilyManageScreen(),
}));

jest.mock("@/features/profile/edit", () => ({
  ProfileEditScreen: () => mockProfileEditScreen(),
}));

jest.mock("@/features/profile/health-detail", () => ({
  HealthInfoDetailScreen: () => mockHealthInfoDetailScreen(),
}));

jest.mock("@/features/scan/prescription-scan-result", () => ({
  PrescriptionScanResultScreen: () => mockPrescriptionScanResultScreen(),
}));

jest.mock("@/features/scan/prescription-scan", () => ({
  PrescriptionScanScreen: () => mockPrescriptionScanScreen(),
}));

describe("app/(detail) routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("detail layout이 Stack을 렌더링한다", () => {
    render(<DetailLayout />);
    expect(mockStack).toHaveBeenCalled();
  });

  it("dashboard medication-history route가 화면 컴포넌트를 렌더링한다", () => {
    render(<MedicationHistoryRoute />);
    expect(mockMedicationHistoryScreen).toHaveBeenCalledTimes(1);
  });

  it("family/profile/scan detail routes가 각 화면을 렌더링한다", () => {
    render(<FamilyManageDetailRoute />);
    render(<ProfileEditRoute />);
    render(<HealthInfoDetailRoute />);
    render(<ScanResultDetailRoute />);
    render(<ScanDetailRoute />);

    expect(mockFamilyManageScreen).toHaveBeenCalledTimes(1);
    expect(mockProfileEditScreen).toHaveBeenCalledTimes(1);
    expect(mockHealthInfoDetailScreen).toHaveBeenCalledTimes(1);
    expect(mockPrescriptionScanResultScreen).toHaveBeenCalledTimes(1);
    expect(mockPrescriptionScanScreen).toHaveBeenCalledTimes(1);
  });
});
