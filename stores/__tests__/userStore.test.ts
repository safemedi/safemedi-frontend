import { renderHook } from "@testing-library/react-native";
import { type User, useHealthInfo, useProfileUser, useUserStore } from "@/stores/userStore";

const BASE_USER: User = {
  id: "user-1",
  displayName: "홍길동",
  email: "test@example.com",
  birthDate: "1990-01-01",
  height: 175,
  weight: 70,
  gender: "male",
  bloodType: "A+",
  allergies: ["peanut"],
  chronicConditions: ["asthma"],
  isTutorial: true,
};

describe("useUserStore", () => {
  beforeEach(() => {
    useUserStore.setState({ user: null });
  });

  it("초기 user 상태는 null이다", () => {
    expect(useUserStore.getState().user).toBeNull();
  });

  it("setUser가 user를 설정한다", () => {
    useUserStore.getState().setUser(BASE_USER);

    expect(useUserStore.getState().user).toEqual(BASE_USER);
  });

  it("updateUser가 기존 user를 patch로 갱신한다", () => {
    useUserStore.getState().setUser(BASE_USER);

    useUserStore.getState().updateUser({
      displayName: "김철수",
      allergies: ["dust"],
    });

    expect(useUserStore.getState().user).toEqual({
      ...BASE_USER,
      displayName: "김철수",
      allergies: ["dust"],
    });
  });

  it("user가 없으면 updateUser가 상태를 변경하지 않는다", () => {
    useUserStore.getState().updateUser({ displayName: "변경시도" });

    expect(useUserStore.getState().user).toBeNull();
  });

  it("clearUser가 user를 null로 초기화한다", () => {
    useUserStore.getState().setUser(BASE_USER);

    useUserStore.getState().clearUser();

    expect(useUserStore.getState().user).toBeNull();
  });

  it("프로필/건강 정보 selector hook은 로컬 user 상태에서 값을 파생한다", () => {
    useUserStore.getState().setUser(BASE_USER);

    const { result: profileUser } = renderHook(() => useProfileUser());
    const { result: healthInfo } = renderHook(() => useHealthInfo());

    expect(profileUser.current).toEqual({ name: "홍길동", role: "주 사용자" });
    expect(healthInfo.current).toEqual({
      allergies: ["peanut"],
      chronicConditions: ["asthma"],
    });
  });
});
