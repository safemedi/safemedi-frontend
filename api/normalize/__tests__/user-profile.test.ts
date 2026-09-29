import { normalizeUserProfile } from "@/api/normalize/user-profile";

describe("normalizeUserProfile", () => {
  it("nickname·분리 rhType 응답을 UserProfile로 정규화한다", () => {
    expect(
      normalizeUserProfile({
        nickname: "카카오유저",
        birthDate: null,
        gender: "MALE",
        height: null,
        weight: null,
        bloodType: "O",
        rhType: "PLUS",
        diseases: [],
        allergies: [],
        isTutorialCompleted: false,
      }),
    ).toEqual({
      displayName: "카카오유저",
      birthDate: null,
      gender: "M",
      height: null,
      weight: null,
      bloodType: "O+",
      diseases: [],
      allergies: [],
      isTutorialCompleted: false,
    });
  });

  it("displayName이 있으면 nickname보다 우선하고 gender/bloodType이 이미 정규화된 값을 유지한다", () => {
    expect(
      normalizeUserProfile({
        displayName: "표시이름",
        nickname: "닉네임",
        gender: "FEMALE",
        bloodType: "AB-",
        rhType: "PLUS",
        diseases: null,
        allergies: ["A01"],
        isTutorialCompleted: true,
      }),
    ).toEqual({
      displayName: "표시이름",
      birthDate: null,
      gender: "F",
      height: null,
      weight: null,
      bloodType: "AB-",
      diseases: null,
      allergies: [{ code: "A01", name: "A01" }],
      isTutorialCompleted: true,
    });
  });

  it("알러지 객체 배열은 code/value/name 우선순위로 정규화하고 빈 객체는 제외한다", () => {
    expect(
      normalizeUserProfile({
        gender: "unknown",
        bloodType: "A",
        rhType: "MINUS",
        allergies: [{ code: "D01", name: "먼지" }, { value: "P01" }, { name: "꽃가루" }, {}, null],
      }),
    ).toEqual({
      displayName: null,
      birthDate: null,
      gender: null,
      height: null,
      weight: null,
      bloodType: "A-",
      diseases: null,
      allergies: [
        { code: "D01", name: "먼지" },
        { code: "P01", name: "P01" },
        { code: "꽃가루", name: "꽃가루" },
      ],
      isTutorialCompleted: false,
    });
  });

  it("기저질환 객체 배열은 code/value/name 우선순위로 정규화하고 빈 객체는 제외한다", () => {
    expect(
      normalizeUserProfile({
        diseases: [
          { code: "COND002", name: "고혈압" },
          { value: "COND013" },
          { name: "천식" },
          {},
          null,
        ],
        allergies: [],
      }),
    ).toEqual({
      displayName: null,
      birthDate: null,
      gender: null,
      height: null,
      weight: null,
      bloodType: null,
      diseases: [
        { code: "COND002", name: "고혈압" },
        { code: "COND013", name: "COND013" },
        { code: "천식", name: "천식" },
      ],
      allergies: [],
      isTutorialCompleted: false,
    });
  });

  it("비어 있거나 알 수 없는 프로필 값은 null/기본값으로 정규화한다", () => {
    expect(
      normalizeUserProfile({
        gender: null,
        bloodType: null,
        rhType: null,
        allergies: "not-array",
      }),
    ).toEqual({
      displayName: null,
      birthDate: null,
      gender: null,
      height: null,
      weight: null,
      bloodType: null,
      diseases: null,
      allergies: null,
      isTutorialCompleted: false,
    });
  });
});
