import { apiPaths } from "@/api/paths";
import { postLogout, postReissueToken, postSocialLogin } from "../auth";
import {
  acceptFamilyInvitation,
  createFamilyInvitation,
  deleteFamily,
  fetchFamilies,
  fetchFamilyInvitation,
  updateFamilyRelation,
} from "../family";
import {
  fetchNotificationSettings,
  fetchNotifications,
  fetchUnreadNotificationCount,
  patchAllNotificationsRead,
  patchNotificationRead,
  patchNotificationSettings,
} from "../notification";
import { createPrescriptionByScan } from "../prescription-scan";
import { postTutorialRegistration } from "../tutorial";
import {
  deleteUserAccount,
  fetchUserProfile,
  fetchUserProfileWithAccessToken,
  patchUserProfile,
} from "../user";

const mockApiGet = jest.fn();
const mockApiPost = jest.fn();
const mockApiPatch = jest.fn();
const mockApiDelete = jest.fn();

jest.mock("@/api/client", () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: (...args: unknown[]) => mockApiPost(...args),
    patch: (...args: unknown[]) => mockApiPatch(...args),
    delete: (...args: unknown[]) => mockApiDelete(...args),
  },
}));

describe("api/endpoints core modules", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("auth login endpoint를 provider/token payload로 호출한다", async () => {
    const expected = { accessToken: "new-token" };
    mockApiPost.mockReturnValueOnce({ json: jest.fn(async () => expected) });

    const result = await postSocialLogin("kakao", "social-token");

    expect(mockApiPost).toHaveBeenCalledWith(apiPaths.authLogin("kakao"), {
      json: { accessToken: "social-token" },
    });
    expect(result).toEqual(expected);
  });

  it("auth logout endpoint를 deviceToken payload로 호출한다", async () => {
    const expected = { message: "로그아웃이 성공적으로 진행되었습니다." };
    mockApiPost.mockReturnValueOnce({ json: jest.fn(async () => expected) });

    const result = await postLogout({ deviceToken: "fcm-token" });

    expect(mockApiPost).toHaveBeenCalledWith(apiPaths.authLogout, {
      json: { deviceToken: "fcm-token" },
    });
    expect(result).toEqual(expected);
  });

  it("auth reissue endpoint를 refreshToken payload로 호출한다", async () => {
    const expected = { accessToken: "new-access-token", refreshToken: "new-refresh-token" };
    mockApiPost.mockReturnValueOnce({ json: jest.fn(async () => expected) });

    const result = await postReissueToken("old-refresh-token");

    expect(mockApiPost).toHaveBeenCalledWith(apiPaths.authReissue, {
      json: { refreshToken: "old-refresh-token" },
    });
    expect(result).toEqual(expected);
  });

  it("family endpoints를 각각 호출한다", async () => {
    mockApiGet.mockReturnValue({
      json: jest.fn(async () => ({ families: [{ familyId: 1 }] })),
      text: jest.fn(async () => ""),
    });
    mockApiPost.mockReturnValue({
      json: jest.fn(async () => ({ invitationId: 1, inviteUrl: "https://invite" })),
    });
    mockApiPatch.mockReturnValue({ json: jest.fn(async () => ({ familyId: 2 })) });
    mockApiDelete.mockReturnValue({ text: jest.fn(async () => "") });

    await fetchFamilies();
    await createFamilyInvitation();
    await fetchFamilyInvitation("token-1");
    await acceptFamilyInvitation("token-1");
    await updateFamilyRelation(2, { relation: "어머니" });
    await deleteFamily(2);

    expect(mockApiGet).toHaveBeenNthCalledWith(1, apiPaths.families);
    expect(mockApiPost).toHaveBeenNthCalledWith(1, apiPaths.familyInvitations);
    expect(mockApiGet).toHaveBeenNthCalledWith(2, apiPaths.familyInvitation("token-1"));
    expect(mockApiPost).toHaveBeenNthCalledWith(2, apiPaths.familyInvitationAccept("token-1"));
    expect(mockApiPatch).toHaveBeenCalledWith(apiPaths.family(2), {
      json: { relation: "어머니" },
    });
    expect(mockApiDelete).toHaveBeenCalledWith(apiPaths.family(2));
  });

  it("notification endpoints를 조회/수정 호출한다", async () => {
    mockApiGet
      .mockReturnValueOnce({ json: jest.fn(async () => ({ isMyReminderOn: true })) })
      .mockReturnValueOnce({ json: jest.fn(async () => ({ content: [], isLast: true })) })
      .mockReturnValueOnce({ json: jest.fn(async () => ({ unreadCount: 2 })) });
    mockApiPatch
      .mockReturnValueOnce({ json: jest.fn(async () => ({ isMyReminderOn: false })) })
      .mockReturnValueOnce({ json: jest.fn(async () => ({ notificationId: 1, isRead: true })) })
      .mockReturnValueOnce({ json: jest.fn(async () => ({ updatedCount: 2 })) });

    await fetchNotificationSettings();
    await fetchNotifications({ page: 0, size: 10 });
    await fetchUnreadNotificationCount();
    await patchNotificationSettings({ isMyReminderOn: false });
    await patchNotificationRead(1);
    await patchAllNotificationsRead();

    expect(mockApiGet).toHaveBeenCalledWith(apiPaths.notificationsSettings);
    expect(mockApiGet).toHaveBeenCalledWith(`${apiPaths.notifications}?page=0&size=10`);
    expect(mockApiGet).toHaveBeenCalledWith(apiPaths.notificationsUnreadCount);
    expect(mockApiPatch).toHaveBeenCalledWith(apiPaths.notificationsSettings, {
      json: { isMyReminderOn: false },
    });
    expect(mockApiPatch).toHaveBeenCalledWith(apiPaths.notificationRead(1));
    expect(mockApiPatch).toHaveBeenCalledWith(apiPaths.notificationsReadAll);
  });

  it("notification list endpoint는 선택된 query parameter만 조합한다", async () => {
    mockApiGet
      .mockReturnValueOnce({ json: jest.fn(async () => ({ content: [] })) })
      .mockReturnValueOnce({ json: jest.fn(async () => ({ content: [] })) })
      .mockReturnValueOnce({ json: jest.fn(async () => ({ content: [] })) });

    await fetchNotifications();
    await fetchNotifications({ page: 1 });
    await fetchNotifications({ size: 30 });

    expect(mockApiGet).toHaveBeenNthCalledWith(1, apiPaths.notifications);
    expect(mockApiGet).toHaveBeenNthCalledWith(2, `${apiPaths.notifications}?page=1`);
    expect(mockApiGet).toHaveBeenNthCalledWith(3, `${apiPaths.notifications}?size=30`);
  });

  it("prescription/tutorial/user endpoints를 호출한다", async () => {
    mockApiPost
      .mockReturnValueOnce({ json: jest.fn(async () => ({ prescriptionId: 1 })) })
      .mockReturnValueOnce({ json: jest.fn(async () => ({ ok: true })) });
    mockApiGet
      .mockReturnValueOnce({ json: jest.fn(async () => ({ id: "me" })) })
      .mockReturnValueOnce({ json: jest.fn(async () => ({ id: "me" })) });
    mockApiPatch.mockReturnValueOnce({ json: jest.fn(async () => ({ id: "me" })) });

    await createPrescriptionByScan({} as never);
    await postTutorialRegistration({} as never);
    await fetchUserProfile();
    await fetchUserProfileWithAccessToken("token-123");
    await patchUserProfile({} as never);

    expect(mockApiPost).toHaveBeenNthCalledWith(1, apiPaths.prescriptions, { json: {} });
    expect(mockApiPost).toHaveBeenNthCalledWith(2, apiPaths.usersMeTutorial, { json: {} });
    expect(mockApiGet).toHaveBeenNthCalledWith(1, apiPaths.usersMe);
    expect(mockApiGet).toHaveBeenNthCalledWith(2, apiPaths.usersMe, {
      headers: { Authorization: "Bearer token-123" },
    });
    expect(mockApiPatch).toHaveBeenCalledWith(apiPaths.usersMe, { json: {} });
  });

  it("user account delete endpoint를 호출한다", async () => {
    const expected = { message: "회원 탈퇴가 정상적으로 완료되었습니다." };
    mockApiDelete.mockReturnValueOnce({ json: jest.fn(async () => expected) });

    const result = await deleteUserAccount();

    expect(mockApiDelete).toHaveBeenCalledWith(apiPaths.usersMe);
    expect(result).toEqual(expected);
  });
});
