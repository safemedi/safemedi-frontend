import { renderHook } from "@testing-library/react-native";
import { queryKeys } from "@/api/query-keys";
import {
  useAcceptFamilyInvitation,
  useDeleteFamily,
  useFamilies,
  useFamilyInvitation,
  useUpdateFamilyRelation,
} from "../family";

const mockFetchFamilies = jest.fn(async () => [
  { familyId: null, name: "홍길동", relation: "본인" },
  { familyId: 7, name: "김영희", relation: "어머니" },
]);
const mockFetchFamilyInvitation = jest.fn<Promise<unknown>, [string]>(async () => ({}));
const mockAcceptFamilyInvitation = jest.fn<Promise<unknown>, [string]>(async () => ({}));
const mockUpdateFamilyRelation = jest.fn<Promise<unknown>, [number, { relation: string }]>(
  async () => ({}),
);
const mockDeleteFamily = jest.fn<Promise<unknown>, [number]>(async () => ({}));
const mockInvalidateQueries = jest.fn();
const mockSetQueryData = jest.fn();

let mockAccessToken: string | null = "token";

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn((options: unknown) => options),
  useQuery: jest.fn((options: unknown) => {
    const query = options as { queryKey?: unknown };
    if (Array.isArray(query.queryKey) && query.queryKey.join("/") === "family/list") {
      return {
        ...options,
        data: [
          { familyId: null, name: "홍길동", relation: "본인" },
          { familyId: 7, name: "김영희", relation: "어머니" },
        ],
      };
    }
    return options;
  }),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
    setQueryData: mockSetQueryData,
  })),
}));

jest.mock("@/api/endpoints/family", () => ({
  acceptFamilyInvitation: (token: string) => mockAcceptFamilyInvitation(token),
  deleteFamily: (familyId: number) => mockDeleteFamily(familyId),
  fetchFamilies: () => mockFetchFamilies(),
  fetchFamilyInvitation: (token: string) => mockFetchFamilyInvitation(token),
  updateFamilyRelation: (familyId: number, body: { relation: string }) =>
    mockUpdateFamilyRelation(familyId, body),
}));

jest.mock("@/stores/sessionStore", () => ({
  useSessionStore: (selector: (state: { accessToken: string | null }) => unknown) =>
    selector({ accessToken: mockAccessToken }),
}));

describe("api/queries/family", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessToken = "token";
  });

  it("가족 목록 쿼리는 토큰이 있을 때 활성화된다", async () => {
    const { result } = renderHook(() => useFamilies());
    const options = result.current as unknown as {
      enabled: boolean;
      staleTime: number;
      queryKey: unknown;
      queryFn: () => Promise<unknown>;
    };

    expect(options.enabled).toBe(true);
    expect(options.staleTime).toBe(5 * 60 * 1000);
    expect(options.queryKey).toEqual(queryKeys.family.list);

    await options.queryFn();
    expect(mockFetchFamilies).toHaveBeenCalledTimes(1);
  });

  it("초대 정보 쿼리는 토큰과 인증 토큰이 있을 때 활성화된다", async () => {
    const { result } = renderHook(() => useFamilyInvitation("abc"));
    const options = result.current as unknown as {
      enabled: boolean;
      queryKey: unknown;
      queryFn: () => Promise<unknown>;
    };

    expect(options.enabled).toBe(true);
    expect(options.queryKey).toEqual(queryKeys.family.invitation("abc"));

    await options.queryFn();
    expect(mockFetchFamilyInvitation).toHaveBeenCalledWith("abc");
  });

  it("초대 정보 쿼리는 인증 토큰이 없으면 비활성화된다", () => {
    mockAccessToken = null;
    const { result } = renderHook(() => useFamilyInvitation("abc"));
    const options = result.current as unknown as { enabled: boolean };

    expect(options.enabled).toBe(false);
  });

  it("수락 mutation 성공 시 가족 목록을 갱신한다", async () => {
    const { result } = renderHook(() => useAcceptFamilyInvitation());
    const options = result.current as unknown as {
      mutationFn: (token: string) => Promise<unknown>;
      onSuccess: (data: { familyId: number; name: string; relation: string }) => Promise<void>;
    };

    await options.mutationFn("abc");
    await options.onSuccess({ familyId: 9, name: "박민수", relation: "가족" });

    expect(mockAcceptFamilyInvitation).toHaveBeenCalledWith("abc");
    expect(mockSetQueryData).toHaveBeenCalledWith(queryKeys.family.list, expect.any(Function));
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.family.list });
  });

  it("호칭 수정 mutation 성공 시 가족 목록을 갱신한다", async () => {
    const { result } = renderHook(() => useUpdateFamilyRelation());
    const options = result.current as unknown as {
      mutationFn: (variables: { familyId: number; body: { relation: string } }) => Promise<unknown>;
      onSuccess: (data: { familyId: number; name: string; relation: string }) => Promise<void>;
    };

    await options.mutationFn({ familyId: 7, body: { relation: "엄마" } });
    await options.onSuccess({ familyId: 7, name: "김영희", relation: "엄마" });

    expect(mockUpdateFamilyRelation).toHaveBeenCalledWith(7, { relation: "엄마" });
    expect(mockSetQueryData).toHaveBeenCalledWith(queryKeys.family.list, expect.any(Function));
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.family.list });
  });

  it("가족 삭제 mutation 성공 시 가족 목록을 갱신한다", async () => {
    const { result } = renderHook(() => useDeleteFamily());
    const options = result.current as unknown as {
      mutationFn: (familyId: number) => Promise<unknown>;
      onSuccess: (result: unknown, familyId: number) => Promise<void>;
    };

    await options.mutationFn(7);
    await options.onSuccess(undefined, 7);

    expect(mockDeleteFamily).toHaveBeenCalledWith(7);
    expect(mockSetQueryData).toHaveBeenCalledWith(queryKeys.family.list, expect.any(Function));
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.family.list });
  });

  it("토큰이 없으면 인증 가족 쿼리를 비활성화한다", () => {
    mockAccessToken = null;
    const { result } = renderHook(() => useFamilies());
    const options = result.current as unknown as { enabled: boolean };

    expect(options.enabled).toBe(false);
  });
});
