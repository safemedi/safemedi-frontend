import { useQueryClient } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react-native";
import { queryKeys } from "@/api/query-keys";
import {
  useFamilyProfiles,
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "../profile";

const mockUseQueryClient = useQueryClient as jest.MockedFunction<typeof useQueryClient>;

const mockFetchFamilies = jest.fn<Promise<Array<{ familyId: number; name: string }>>, []>(
  async () => [{ familyId: 10, name: "가족A" }],
);
const mockFetchNotificationSettings = jest.fn<
  Promise<{ isMyReminderOn: boolean; isFamilyReminderOn: boolean; isMissedAlertOn: boolean }>,
  []
>(async () => ({ isMyReminderOn: true, isFamilyReminderOn: false, isMissedAlertOn: true }));
const mockPatchNotificationSettings = jest.fn<
  Promise<{ isMyReminderOn: boolean; isFamilyReminderOn: boolean; isMissedAlertOn: boolean }>,
  [unknown]
>(async () => ({ isMyReminderOn: false, isFamilyReminderOn: true, isMissedAlertOn: true }));

const mockCancelQueries = jest.fn(async () => {});
const mockGetQueryData = jest.fn();
const mockSetQueryData = jest.fn<unknown, [unknown, unknown]>();
const mockInvalidateQueries = jest.fn(async () => {});

let mockAccessToken: string | null = "token";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn((options: unknown) => options),
  useMutation: jest.fn((options: unknown) => options),
  useQueryClient: jest.fn(),
}));

jest.mock("@/api/endpoints/family", () => ({
  fetchFamilies: () => mockFetchFamilies(),
}));

jest.mock("@/api/endpoints/notification", () => ({
  fetchNotificationSettings: () => mockFetchNotificationSettings(),
  patchNotificationSettings: (body: unknown) => mockPatchNotificationSettings(body),
}));

jest.mock("@/stores/sessionStore", () => ({
  useSessionStore: (selector: (state: { accessToken: string | null }) => unknown) =>
    selector({ accessToken: mockAccessToken }),
}));

describe("api/queries/profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessToken = "token";
    mockUseQueryClient.mockReturnValue({
      cancelQueries: mockCancelQueries,
      getQueryData: mockGetQueryData,
      setQueryData: mockSetQueryData,
      invalidateQueries: mockInvalidateQueries,
    } as unknown as ReturnType<typeof useQueryClient>);
  });

  it("가족 목록 쿼리는 서버 가족 목록을 조회한다", async () => {
    const { result } = renderHook(() => useFamilyProfiles());
    const query = result.current as unknown as {
      enabled: boolean;
      queryKey: unknown;
      queryFn: () => Promise<Array<{ familyId: number; name: string }>>;
    };

    expect(query.enabled).toBe(true);
    expect(query.queryKey).toEqual(queryKeys.profile.families);
    const list = await query.queryFn();
    expect(mockFetchFamilies).toHaveBeenCalledTimes(1);
    expect(list[0]).toEqual(expect.objectContaining({ familyId: 10, name: "가족A" }));
  });

  it("알림 설정 조회/수정 훅은 쿼리 키와 mutation 핸들러를 구성한다", async () => {
    const { result: notificationResult } = renderHook(() => useNotificationSettings());
    const query = notificationResult.current as unknown as {
      queryKey: unknown;
      queryFn: () => Promise<unknown>;
    };
    expect(query.queryKey).toEqual(queryKeys.profile.notificationSettings);
    await query.queryFn();
    expect(mockFetchNotificationSettings).toHaveBeenCalledTimes(1);

    mockGetQueryData.mockReturnValue({
      isMyReminderOn: true,
      isFamilyReminderOn: false,
      isMissedAlertOn: true,
    });
    const { result: mutationResult } = renderHook(() => useUpdateNotificationSettings());
    const mutation = mutationResult.current as unknown as {
      mutationFn: (body: unknown) => Promise<unknown>;
      onMutate: (patch: {
        isMyReminderOn?: boolean;
        isFamilyReminderOn?: boolean;
        isMissedAlertOn?: boolean;
      }) => Promise<{ previous: unknown }>;
      onError: (
        _error: unknown,
        _patch: {
          isMyReminderOn?: boolean;
          isFamilyReminderOn?: boolean;
          isMissedAlertOn?: boolean;
        },
        context: {
          previous?: {
            isMyReminderOn: boolean;
            isFamilyReminderOn: boolean;
            isMissedAlertOn: boolean;
          };
        },
      ) => void;
      onSuccess: (
        updated: {
          isMyReminderOn: boolean;
          isFamilyReminderOn: boolean;
          isMissedAlertOn: boolean;
        },
        patch: {
          isMyReminderOn?: boolean;
          isFamilyReminderOn?: boolean;
          isMissedAlertOn?: boolean;
        },
      ) => void;
      onSettled: () => Promise<void>;
    };

    await mutation.mutationFn({ isMyReminderOn: false });
    expect(mockPatchNotificationSettings).toHaveBeenCalledWith({ isMyReminderOn: false });

    const context = await mutation.onMutate({ isMyReminderOn: false });
    expect(context.previous).toEqual({
      isMyReminderOn: true,
      isFamilyReminderOn: false,
      isMissedAlertOn: true,
    });
    expect(mockSetQueryData).toHaveBeenCalledWith(queryKeys.profile.notificationSettings, {
      isMyReminderOn: false,
      isFamilyReminderOn: false,
      isMissedAlertOn: true,
    });

    mockSetQueryData.mockClear();
    mutation.onError(
      new Error("x"),
      { isMyReminderOn: false },
      {
        previous: {
          isMyReminderOn: true,
          isFamilyReminderOn: false,
          isMissedAlertOn: true,
        },
      },
    );
    const errorUpdater = mockSetQueryData.mock.calls[0]?.[1] as (current: {
      isMyReminderOn: boolean;
      isFamilyReminderOn: boolean;
      isMissedAlertOn: boolean;
    }) => unknown;
    expect(mockSetQueryData.mock.calls[0]?.[0]).toEqual(queryKeys.profile.notificationSettings);
    expect(
      errorUpdater({
        isMyReminderOn: false,
        isFamilyReminderOn: true,
        isMissedAlertOn: true,
      }),
    ).toEqual({
      isMyReminderOn: true,
      isFamilyReminderOn: true,
      isMissedAlertOn: true,
    });

    mockSetQueryData.mockClear();
    mutation.onSuccess(
      { isMyReminderOn: false, isFamilyReminderOn: false, isMissedAlertOn: true },
      { isMyReminderOn: false },
    );
    const successUpdater = mockSetQueryData.mock.calls[0]?.[1] as (current: {
      isMyReminderOn: boolean;
      isFamilyReminderOn: boolean;
      isMissedAlertOn: boolean;
    }) => unknown;
    expect(
      successUpdater({
        isMyReminderOn: false,
        isFamilyReminderOn: true,
        isMissedAlertOn: true,
      }),
    ).toEqual({
      isMyReminderOn: false,
      isFamilyReminderOn: true,
      isMissedAlertOn: true,
    });

    expect(
      successUpdater({
        isMyReminderOn: true,
        isFamilyReminderOn: true,
        isMissedAlertOn: true,
      }),
    ).toEqual({
      isMyReminderOn: true,
      isFamilyReminderOn: true,
      isMissedAlertOn: true,
    });

    await mutation.onSettled();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.profile.notificationSettings,
    });
  });
});
