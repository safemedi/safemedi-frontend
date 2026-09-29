import { renderHook } from "@testing-library/react-native";
import { queryKeys } from "@/api/query-keys";
import { useLogoutMutation } from "../auth";

const mockPostLogout = jest.fn<Promise<unknown>, [unknown]>();

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn((options: unknown) => options),
}));

jest.mock("@/api/endpoints/auth", () => ({
  postLogout: (body: unknown) => mockPostLogout(body),
}));

describe("api/queries/auth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPostLogout.mockResolvedValue({ message: "ok" });
  });

  it("useLogoutMutation은 로그아웃 mutation key와 endpoint를 연결한다", async () => {
    const { result } = renderHook(() => useLogoutMutation());
    const mutation = result.current as unknown as {
      mutationKey: unknown;
      mutationFn: (body: { deviceToken: string }) => Promise<unknown>;
    };

    expect(mutation.mutationKey).toEqual(queryKeys.auth.logout);
    await mutation.mutationFn({ deviceToken: "fcm-token" });
    expect(mockPostLogout).toHaveBeenCalledWith({ deviceToken: "fcm-token" });
  });
});
