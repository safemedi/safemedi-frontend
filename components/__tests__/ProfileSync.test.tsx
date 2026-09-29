import { render } from "@testing-library/react-native";
import { ProfileSync } from "../ProfileSync";

const mockUseUserProfile = jest.fn();
const mockSetUser = jest.fn();
const mockClearUser = jest.fn();
const mockProfileToUser = jest.fn((profile: unknown) => ({ mapped: profile }));

let mockHydrated = true;
let mockAccessToken: string | null = "token";

jest.mock("@/api/queries/user", () => ({
  useUserProfile: () => mockUseUserProfile(),
}));

jest.mock("@/hooks/useSessionHydrated", () => ({
  useSessionHydrated: () => mockHydrated,
}));

jest.mock("@/stores/sessionStore", () => ({
  useSessionStore: (selector: (state: { accessToken: string | null }) => unknown) =>
    selector({ accessToken: mockAccessToken }),
}));

jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: { setUser: () => void; clearUser: () => void }) => unknown) =>
    selector({
      setUser: mockSetUser,
      clearUser: mockClearUser,
    }),
}));

jest.mock("@/utils/user-mapper", () => ({
  profileToUser: (profile: unknown) => mockProfileToUser(profile),
}));

describe("ProfileSync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHydrated = true;
    mockAccessToken = "token";
    mockUseUserProfile.mockReturnValue({ data: null });
  });

  it("세션이 hydrate 되지 않았으면 아무 동작도 하지 않는다", () => {
    mockHydrated = false;
    mockUseUserProfile.mockReturnValue({ data: { id: "u1" } });

    render(<ProfileSync />);

    expect(mockSetUser).not.toHaveBeenCalled();
    expect(mockClearUser).not.toHaveBeenCalled();
  });

  it("토큰이 없으면 user를 clear한다", () => {
    mockAccessToken = null;
    render(<ProfileSync />);

    expect(mockClearUser).toHaveBeenCalledTimes(1);
    expect(mockSetUser).not.toHaveBeenCalled();
  });

  it("프로필이 있으면 매핑 후 user를 set한다", () => {
    const profile = { id: "u1", displayName: "홍길동" };
    mockUseUserProfile.mockReturnValue({ data: profile });

    render(<ProfileSync />);

    expect(mockProfileToUser).toHaveBeenCalledWith(profile);
    expect(mockSetUser).toHaveBeenCalledWith({ mapped: profile });
  });
});
