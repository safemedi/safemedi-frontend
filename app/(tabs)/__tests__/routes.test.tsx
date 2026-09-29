import { render } from "@testing-library/react-native";
import DashboardTabRoute from "../dashboard";
import TabTwoScreen from "../manage";
import MapScreen from "../map";
import ProfileTabRoute from "../profile";
import ScanTabRoute from "../scan";

const mockDashboardScreen = jest.fn(() => null);
const mockMedicationReportScreen = jest.fn(() => null);
const mockMapDomainScreen = jest.fn(() => null);
const mockProfileScreen = jest.fn(() => null);
interface RedirectProps {
  readonly href: string;
}

const mockRedirect = jest.fn<null, [RedirectProps]>(() => null);

jest.mock("expo-router", () => ({
  Redirect: (props: RedirectProps) => mockRedirect(props),
}));

jest.mock("tamagui", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    View: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

jest.mock("@/features/map", () => ({
  MapScreen: () => mockMapDomainScreen(),
}));

jest.mock("@/features/dashboard/home", () => ({
  DashboardScreen: () => mockDashboardScreen(),
}));

jest.mock("@/features/manage", () => ({
  MedicationReportScreen: () => mockMedicationReportScreen(),
}));

jest.mock("@/features/profile/view", () => ({
  ProfileScreen: () => mockProfileScreen(),
}));

describe("app/(tabs) routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("dashboard/profile route가 각 화면을 렌더링한다", () => {
    render(<DashboardTabRoute />);
    render(<ProfileTabRoute />);

    expect(mockDashboardScreen).toHaveBeenCalledTimes(1);
    expect(mockProfileScreen).toHaveBeenCalledTimes(1);
  });

  it("manage/map route는 각 라우트 컴포넌트를 연결한다", () => {
    render(<TabTwoScreen />);
    render(<MapScreen />);

    expect(mockMedicationReportScreen).toHaveBeenCalledTimes(1);
    expect(mockMapDomainScreen).toHaveBeenCalledTimes(1);
  });

  it("scan route는 detail scan으로 Redirect한다", () => {
    render(<ScanTabRoute />);
    expect(mockRedirect).toHaveBeenCalledWith({ href: "/(detail)/scan/scan" });
  });
});
