import { useQueryClient } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react-native";
import { queryKeys } from "@/api/query-keys";
import type { NotificationListResponse } from "@/api/types";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "../notification";

const mockUseQueryClient = useQueryClient as jest.MockedFunction<typeof useQueryClient>;

const mockFetchNotifications = jest.fn<Promise<NotificationListResponse>, [unknown]>(async () => ({
  content: [],
  page: 0,
  size: 20,
  isLast: true,
}));
const mockFetchUnreadNotificationCount = jest.fn<Promise<{ unreadCount: number }>, []>(
  async () => ({
    unreadCount: 2,
  }),
);
const mockPatchNotificationRead = jest.fn<Promise<unknown>, [number]>(async () => ({
  notificationId: 1,
  isRead: true,
}));
const mockPatchAllNotificationsRead = jest.fn<Promise<unknown>, []>(async () => ({
  updatedCount: 2,
}));
const mockCancelQueries = jest.fn(async () => {});
const mockGetQueriesData = jest.fn();
const mockGetQueryData = jest.fn();
const mockSetQueryData = jest.fn<unknown, [unknown, unknown]>();
const mockInvalidateQueries = jest.fn(async () => {});

let mockAccessToken: string | null = "token";

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn((options: unknown) => options),
  useQuery: jest.fn((options: unknown) => options),
  useQueryClient: jest.fn(),
}));

jest.mock("@/api/endpoints/notification", () => ({
  fetchNotifications: (params: unknown) => mockFetchNotifications(params),
  fetchUnreadNotificationCount: () => mockFetchUnreadNotificationCount(),
  patchAllNotificationsRead: () => mockPatchAllNotificationsRead(),
  patchNotificationRead: (notificationId: number) => mockPatchNotificationRead(notificationId),
}));

jest.mock("@/stores/sessionStore", () => ({
  useSessionStore: (selector: (state: { accessToken: string | null }) => unknown) =>
    selector({ accessToken: mockAccessToken }),
}));

const notificationList: NotificationListResponse = {
  content: [
    {
      notificationId: 1,
      type: "MEDICATION_REMINDER",
      title: "복약 시간",
      message: "약을 복용하세요",
      isRead: false,
      targetType: "MEDICATION_RECORD",
      targetId: 10,
      createdAt: "2026-04-07T08:50:00",
    },
    {
      notificationId: 2,
      type: "SYSTEM_NOTICE",
      title: "공지",
      message: "이미 읽은 알림",
      isRead: true,
      targetType: null,
      targetId: null,
      createdAt: "2026-04-06T08:50:00",
    },
  ],
  page: 0,
  size: 20,
  isLast: true,
};

describe("api/queries/notification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessToken = "token";
    mockGetQueriesData.mockReturnValue([[queryKeys.notification.list(0, 20), notificationList]]);
    mockGetQueryData.mockReturnValue({ unreadCount: 2 });
    mockUseQueryClient.mockReturnValue({
      cancelQueries: mockCancelQueries,
      getQueriesData: mockGetQueriesData,
      getQueryData: mockGetQueryData,
      invalidateQueries: mockInvalidateQueries,
      setQueryData: mockSetQueryData,
    } as unknown as ReturnType<typeof useQueryClient>);
  });

  it("알림 목록 쿼리는 page/size 기본값과 토큰 enabled를 구성한다", async () => {
    const { result } = renderHook(() => useNotifications());
    const options = result.current as unknown as {
      enabled: boolean;
      queryKey: unknown;
      queryFn: () => Promise<NotificationListResponse>;
    };

    expect(options.enabled).toBe(true);
    expect(options.queryKey).toEqual(queryKeys.notification.list(0, 20));
    await options.queryFn();
    expect(mockFetchNotifications).toHaveBeenCalledWith({ page: 0, size: 20 });
  });

  it("알림 목록 쿼리는 토큰이 없으면 비활성화되고 전달한 page/size를 사용한다", () => {
    mockAccessToken = null;

    const { result } = renderHook(() => useNotifications({ page: 2, size: 5 }));
    const options = result.current as unknown as { enabled: boolean; queryKey: unknown };

    expect(options.enabled).toBe(false);
    expect(options.queryKey).toEqual(queryKeys.notification.list(2, 5));
  });

  it("미읽음 개수 쿼리는 전용 query key와 endpoint를 사용한다", async () => {
    const { result } = renderHook(() => useUnreadNotificationCount());
    const options = result.current as unknown as {
      enabled: boolean;
      queryKey: unknown;
      queryFn: () => Promise<{ unreadCount: number }>;
    };

    expect(options.enabled).toBe(true);
    expect(options.queryKey).toEqual(queryKeys.notification.unreadCount);
    await options.queryFn();
    expect(mockFetchUnreadNotificationCount).toHaveBeenCalledTimes(1);
  });

  it("개별 읽음 mutation은 목록과 미읽음 개수를 낙관적으로 갱신한다", async () => {
    const { result } = renderHook(() => useMarkNotificationRead());
    const mutation = result.current as unknown as {
      mutationFn: (notificationId: number) => Promise<unknown>;
      onMutate: (notificationId: number) => Promise<{
        previousListQueries: Array<[unknown, NotificationListResponse | undefined]>;
        previousUnread: { unreadCount: number } | undefined;
      }>;
      onError: (
        error: unknown,
        notificationId: number,
        context: {
          previousListQueries: Array<[unknown, NotificationListResponse | undefined]>;
          previousUnread: { unreadCount: number };
        },
      ) => void;
      onSettled: () => Promise<void>;
    };

    await mutation.mutationFn(1);
    expect(mockPatchNotificationRead).toHaveBeenCalledWith(1);

    const context = await mutation.onMutate(1);
    expect(mockCancelQueries).toHaveBeenCalledWith({ queryKey: ["notification"] });
    expect(mockSetQueryData).toHaveBeenCalledWith(
      queryKeys.notification.list(0, 20),
      expect.objectContaining({
        content: expect.arrayContaining([
          expect.objectContaining({ notificationId: 1, isRead: true }),
        ]),
      }),
    );
    expect(mockSetQueryData).toHaveBeenCalledWith(queryKeys.notification.unreadCount, {
      unreadCount: 1,
    });

    mutation.onError(new Error("x"), 1, {
      previousListQueries: context.previousListQueries,
      previousUnread: { unreadCount: 2 },
    });
    expect(mockSetQueryData).toHaveBeenCalledWith(queryKeys.notification.unreadCount, {
      unreadCount: 2,
    });

    await mutation.onSettled();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["notification"] });
  });

  it("개별 읽음 mutation은 캐시 데이터가 없거나 unreadCount가 0이면 해당 갱신을 건너뛴다", async () => {
    mockGetQueriesData.mockReturnValue([[queryKeys.notification.list(0, 20), undefined]]);
    mockGetQueryData.mockReturnValue({ unreadCount: 0 });

    const { result } = renderHook(() => useMarkNotificationRead());
    const mutation = result.current as unknown as {
      onMutate: (notificationId: number) => Promise<unknown>;
    };

    await mutation.onMutate(1);

    expect(mockSetQueryData).not.toHaveBeenCalledWith(
      queryKeys.notification.unreadCount,
      expect.anything(),
    );
  });

  it("모두 읽음 mutation은 모든 목록 항목과 미읽음 개수를 갱신하고 실패 시 롤백한다", async () => {
    const { result } = renderHook(() => useMarkAllNotificationsRead());
    const mutation = result.current as unknown as {
      mutationFn: () => Promise<unknown>;
      onMutate: () => Promise<{
        previousListQueries: Array<[unknown, NotificationListResponse | undefined]>;
        previousUnread: { unreadCount: number };
      }>;
      onError: (
        error: unknown,
        variables: unknown,
        context: {
          previousListQueries: Array<[unknown, NotificationListResponse | undefined]>;
          previousUnread: { unreadCount: number };
        },
      ) => void;
      onSettled: () => Promise<void>;
    };

    await mutation.mutationFn();
    expect(mockPatchAllNotificationsRead).toHaveBeenCalledTimes(1);

    const context = await mutation.onMutate();
    expect(mockSetQueryData).toHaveBeenCalledWith(
      queryKeys.notification.list(0, 20),
      expect.objectContaining({
        content: expect.arrayContaining([
          expect.objectContaining({ notificationId: 1, isRead: true }),
          expect.objectContaining({ notificationId: 2, isRead: true }),
        ]),
      }),
    );
    expect(mockSetQueryData).toHaveBeenCalledWith(queryKeys.notification.unreadCount, {
      unreadCount: 0,
    });

    mutation.onError(new Error("x"), undefined, context);
    expect(mockSetQueryData).toHaveBeenCalledWith(
      queryKeys.notification.list(0, 20),
      notificationList,
    );
    expect(mockSetQueryData).toHaveBeenCalledWith(queryKeys.notification.unreadCount, {
      unreadCount: 2,
    });

    await mutation.onSettled();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["notification"] });
  });
});
