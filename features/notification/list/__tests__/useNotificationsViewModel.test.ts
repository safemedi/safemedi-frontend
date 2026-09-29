import { renderHook } from "@testing-library/react-native";

import type { NotificationItem } from "@/api/types";

import { useNotificationsViewModel } from "../useNotificationsViewModel";

const mockRefetch = jest.fn();
const mockMarkRead = jest.fn();
const mockMarkAllRead = jest.fn();
const mockRouterBack = jest.fn();
const mockRouterPush = jest.fn();

const defaultNotifications: NotificationItem[] = [
  {
    notificationId: 1,
    type: "MEDICATION_REMINDER",
    title: "약 복용 시간입니다",
    message: "테스트 메시지",
    isRead: false,
    targetType: "MEDICATION_RECORD",
    targetId: 100,
    createdAt: "2026-04-07T08:50:00",
  },
  {
    notificationId: 2,
    type: "MEDICATION_COMPLETED",
    title: "복약 완료",
    message: "이미 읽은 알림",
    isRead: true,
    targetType: "MEDICATION_RECORD",
    targetId: 101,
    createdAt: "2026-04-07T07:00:00",
  },
];

let mockNotificationsContent: NotificationItem[] | undefined = defaultNotifications;
let mockUnreadCountData: { unreadCount: number } | undefined = { unreadCount: 1 };
let mockIsNotificationsLoading = false;
let mockIsNotificationsError = false;
let mockIsMarkAllReadPending = false;

jest.mock("expo-router", () => ({
  router: {
    back: (...args: unknown[]) => mockRouterBack(...args),
    push: (...args: unknown[]) => mockRouterPush(...args),
  },
}));

jest.mock("@/api/queries/notification", () => ({
  useNotifications: () => ({
    data:
      mockNotificationsContent === undefined ? undefined : { content: mockNotificationsContent },
    isLoading: mockIsNotificationsLoading,
    isError: mockIsNotificationsError,
    refetch: mockRefetch,
  }),
  useUnreadNotificationCount: () => ({
    data: mockUnreadCountData,
  }),
  useMarkNotificationRead: () => ({
    mutate: mockMarkRead,
  }),
  useMarkAllNotificationsRead: () => ({
    mutate: mockMarkAllRead,
    isPending: mockIsMarkAllReadPending,
  }),
}));

describe("useNotificationsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotificationsContent = defaultNotifications;
    mockUnreadCountData = { unreadCount: 1 };
    mockIsNotificationsLoading = false;
    mockIsNotificationsError = false;
    mockIsMarkAllReadPending = false;
  });

  it("알림 목록과 미읽음 개수를 반환한다", () => {
    const { result } = renderHook(() => useNotificationsViewModel());

    expect(result.current.items).toHaveLength(2);
    expect(result.current.unreadCount).toBe(1);
  });

  it("알림 데이터와 미읽음 데이터가 없으면 기본 상태를 반환한다", () => {
    mockNotificationsContent = undefined;
    mockUnreadCountData = undefined;
    mockIsNotificationsLoading = true;
    mockIsNotificationsError = true;

    const { result } = renderHook(() => useNotificationsViewModel());

    expect(result.current.items).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(true);
  });

  it("뒤로가기 시 router.back을 호출한다", () => {
    const { result } = renderHook(() => useNotificationsViewModel());

    result.current.handlePressBack();

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });

  it("모두 읽음 시 markAllRead mutation을 호출한다", () => {
    const { result } = renderHook(() => useNotificationsViewModel());

    result.current.handlePressMarkAllRead();

    expect(mockMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it("읽지 않은 알림이 없거나 모두 읽음 처리 중이면 모두 읽음을 생략한다", () => {
    mockUnreadCountData = { unreadCount: 0 };
    const { result, rerender } = renderHook(() => useNotificationsViewModel());

    result.current.handlePressMarkAllRead();

    expect(mockMarkAllRead).not.toHaveBeenCalled();

    mockUnreadCountData = { unreadCount: 1 };
    mockIsMarkAllReadPending = true;
    rerender({});

    result.current.handlePressMarkAllRead();

    expect(mockMarkAllRead).not.toHaveBeenCalled();
    expect(result.current.isMarkAllReadPending).toBe(true);
  });

  it("알림 클릭 시 읽음 처리 후 대상 화면으로 이동한다", () => {
    const { result } = renderHook(() => useNotificationsViewModel());
    const item = result.current.items[0];

    result.current.handlePressNotification(item);

    expect(mockMarkRead).toHaveBeenCalledWith(1);
    expect(mockRouterPush).toHaveBeenCalledWith("/(tabs)/dashboard");
  });

  it("이미 읽은 알림 클릭 시 읽음 처리는 생략하고 대상 화면으로 이동한다", () => {
    const { result } = renderHook(() => useNotificationsViewModel());
    const item = result.current.items[1];

    result.current.handlePressNotification(item);

    expect(mockMarkRead).not.toHaveBeenCalled();
    expect(mockRouterPush).toHaveBeenCalledWith("/(tabs)/dashboard");
  });

  it("처방 대상 알림은 처방 상세로 이동한다", () => {
    const { result } = renderHook(() => useNotificationsViewModel());

    result.current.handlePressNotification({
      ...defaultNotifications[0],
      targetType: "PRESCRIPTION",
      targetId: 7,
    });

    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: "/(detail)/dashboard/medication-history",
      params: { prescriptionId: "7" },
    });
  });

  it("리포트 대상 알림은 관리 탭으로 이동한다", () => {
    const { result } = renderHook(() => useNotificationsViewModel());

    result.current.handlePressNotification({
      ...defaultNotifications[0],
      targetType: "REPORT",
      targetId: null,
    });

    expect(mockRouterPush).toHaveBeenCalledWith("/(tabs)/manage");
  });

  it("이동 대상이 없는 알림은 읽음 처리만 수행한다", () => {
    const { result } = renderHook(() => useNotificationsViewModel());

    result.current.handlePressNotification({
      ...defaultNotifications[0],
      targetType: null,
      targetId: null,
    });

    expect(mockMarkRead).toHaveBeenCalledWith(1);
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
