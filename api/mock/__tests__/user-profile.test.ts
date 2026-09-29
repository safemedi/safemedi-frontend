import { registerSaf26Mocks } from "@/api/mock/handlers";
import { MockRegistry } from "@/api/mock/registry";
import { mockState } from "@/api/mock/state";
import type { UserProfile } from "@/api/types";

describe("사용자 프로필 mock", () => {
  const initialProfile: UserProfile = {
    ...mockState.profile,
    diseases: mockState.profile.diseases ? [...mockState.profile.diseases] : null,
    allergies: mockState.profile.allergies ? [...mockState.profile.allergies] : null,
  };

  beforeEach(() => {
    mockState.profile = {
      ...initialProfile,
      diseases: initialProfile.diseases ? [...initialProfile.diseases] : null,
      allergies: initialProfile.allergies ? [...initialProfile.allergies] : null,
    };
  });

  it("혈액형 PATCH mock은 rhType 누락 시 Rh+로 저장한다", async () => {
    const registry = new MockRegistry();
    registerSaf26Mocks(registry);
    const patchRoute = registry.find("PATCH", "/api/v1/users/me");

    if (!patchRoute) {
      throw new Error("사용자 프로필 PATCH mock route가 등록되지 않았습니다.");
    }

    await patchRoute.handler({
      method: "PATCH",
      path: "/api/v1/users/me",
      searchParams: new URLSearchParams(),
      jsonBody: { bloodType: "AB" },
    });

    expect(mockState.profile.bloodType).toBe("AB+");
  });

  it("혈액형 PATCH mock은 rhType만 오면 기존 ABO에 반영한다", async () => {
    mockState.profile.bloodType = "AB+";
    const registry = new MockRegistry();
    registerSaf26Mocks(registry);
    const patchRoute = registry.find("PATCH", "/api/v1/users/me");

    if (!patchRoute) {
      throw new Error("사용자 프로필 PATCH mock route가 등록되지 않았습니다.");
    }

    await patchRoute.handler({
      method: "PATCH",
      path: "/api/v1/users/me",
      searchParams: new URLSearchParams(),
      jsonBody: { rhType: "MINUS" },
    });

    expect(mockState.profile.bloodType).toBe("AB-");
  });
});
