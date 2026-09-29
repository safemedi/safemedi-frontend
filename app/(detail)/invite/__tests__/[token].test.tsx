import { render } from "@testing-library/react-native";
import InviteTokenRoute from "../[token]";

const mockUseLocalSearchParams = jest.fn();
const mockInviteAcceptScreen = jest.fn<null, [{ token: string | null }]>(() => null);

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock("@/features/family/invite-accept", () => ({
  InviteAcceptScreen: (props: { token: string | null }) => mockInviteAcceptScreen(props),
}));

describe("app/(detail)/invite/[token]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("token 문자열을 그대로 전달한다", () => {
    mockUseLocalSearchParams.mockReturnValue({ token: "abc123" });
    render(<InviteTokenRoute />);

    expect(mockInviteAcceptScreen).toHaveBeenCalledWith({ token: "abc123" });
  });

  it("배열 파라미터는 첫 번째 값을 사용한다", () => {
    mockUseLocalSearchParams.mockReturnValue({ token: ["first", "second"] });
    render(<InviteTokenRoute />);

    expect(mockInviteAcceptScreen).toHaveBeenCalledWith({ token: "first" });
  });

  it("token이 없으면 null을 전달한다", () => {
    mockUseLocalSearchParams.mockReturnValue({ token: undefined });
    render(<InviteTokenRoute />);

    expect(mockInviteAcceptScreen).toHaveBeenCalledWith({ token: null });
  });
});
