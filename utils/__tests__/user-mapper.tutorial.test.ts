import {
  buildUserAllergyEditState,
  chronicConditionLabelsToDiseaseCodes,
  profileAllergyLabelsToApiCodes,
  profileAllergyLabelsToPatchItems,
  profileAllergyLabelsToTutorialItems,
  profileToUser,
  userToTutorialRegistrationBody,
} from "@/utils/user-mapper";

const baseUser = {
  id: "me",
  displayName: "홍길동",
  email: null,
  birthDate: "1990-01-01",
  height: 170,
  weight: 65,
  gender: "female" as const,
  bloodType: "AB+" as const,
  allergies: ["국소용 항생제", "해산물", "직접입력알러지", "국소용 항생제"],
  chronicConditions: ["천식"],
  isTutorial: false,
};

describe("튜토리얼 사용자 매핑", () => {
  it("소셜 로그인 직후 null 프로필 필드를 안전하게 User로 변환한다", () => {
    const user = profileToUser({
      displayName: "카카오유저",
      birthDate: null,
      gender: null,
      height: null,
      weight: null,
      bloodType: null,
      diseases: null,
      allergies: null,
      isTutorialCompleted: false,
    });

    expect(user).toEqual({
      id: "me",
      displayName: "카카오유저",
      email: null,
      birthDate: null,
      height: null,
      weight: null,
      gender: null,
      bloodType: null,
      allergies: [],
      chronicConditions: [],
      isTutorial: false,
    });
  });

  it("서버 알러지를 대표 라벨과 검색 매핑으로 변환한다", () => {
    const user = profileToUser({
      displayName: "홍길동",
      birthDate: "1990-01-01",
      gender: "F",
      height: 170,
      weight: 65,
      bloodType: "AB-",
      diseases: [{ code: "COND010", name: "천식" }],
      allergies: [
        { code: "D06A", name: "국소용 항생제" },
        { code: "해산물", name: "해산물" },
        { code: "R06AX13", name: "꽃가루" },
      ],
      isTutorialCompleted: true,
    });

    expect(user.allergies).toEqual(["국소용 항생제", "해산물", "꽃가루"]);
    expect(user.allergyMappings).toEqual({
      꽃가루: { type: "ATC_GROUP", value: "R06AX13", name: "꽃가루" },
    });
    expect(user.chronicConditions).toEqual(["천식"]);
    expect(user.chronicConditionMappings).toEqual({ 천식: "COND010" });
  });

  it("서버 기저질환을 대표 라벨과 검색 매핑으로 변환한다", () => {
    const user = profileToUser({
      displayName: "홍길동",
      birthDate: "1990-01-01",
      gender: "F",
      height: 170,
      weight: 65,
      bloodType: "AB-",
      diseases: [
        { code: "COND002", name: "고혈압" },
        { code: "J45", name: "천식" },
        { code: "G43", name: "편두통" },
      ],
      allergies: [],
      isTutorialCompleted: true,
    });

    expect(user.chronicConditions).toEqual(["고혈압", "천식", "편두통"]);
    expect(user.chronicConditionMappings).toEqual({
      고혈압: "COND002",
      천식: "J45",
      편두통: "G43",
    });
  });

  it("편집 화면 초기 상태를 알러지 라벨과 매핑을 함께 복원한다", () => {
    expect(
      buildUserAllergyEditState(["국소용 항생제", "해산물", "꽃가루"], {
        꽃가루: { type: "ATC_GROUP", value: "R06AX13", name: "꽃가루" },
      }),
    ).toEqual({
      labels: ["국소용 항생제", "해산물", "꽃가루"],
      mappings: {
        꽃가루: { type: "ATC_GROUP", value: "R06AX13", name: "꽃가루" },
      },
    });
  });

  it("매핑 없는 비대표 알러지도 편집 상태에 보존한다", () => {
    expect(buildUserAllergyEditState(["국소용 항생제", "꽃가루"], {})).toEqual({
      labels: ["국소용 항생제", "꽃가루"],
      mappings: {
        꽃가루: { type: "FOOD", value: "꽃가루", name: "꽃가루" },
      },
    });
  });

  it("서버 표시명 알러지를 대표 라벨로 정규화한다", () => {
    expect(buildUserAllergyEditState(["국소용 항생제", "해산물"], {})).toEqual({
      labels: ["국소용 항생제", "해산물"],
      mappings: {},
    });
  });

  it("프로필 알러지 라벨을 중복 제거된 API 코드로 변환한다", () => {
    const mapped = profileAllergyLabelsToApiCodes([
      "국소용 항생제",
      "해산물",
      "직접입력알러지",
      "국소용 항생제",
    ]);

    expect(mapped).toEqual(expect.arrayContaining(["D06A", "해산물"]));
    expect(mapped).toHaveLength(2);
  });

  it("튜토리얼 알러지 라벨을 type/value/name 객체 배열로 변환한다", () => {
    const mapped = profileAllergyLabelsToTutorialItems([
      "국소용 항생제",
      "해산물",
      "직접입력알러지",
      "국소용 항생제",
    ]);

    expect(mapped).toEqual(
      expect.arrayContaining([
        { type: "ATC_GROUP", value: "D06A", name: "국소용 항생제" },
        { type: "FOOD", value: "해산물", name: "해산물" },
        { type: "FOOD", value: "직접입력알러지", name: "직접입력알러지" },
      ]),
    );
    expect(mapped).toHaveLength(3);
  });

  it("튜토리얼 알러지 검색 선택 매핑을 우선 사용한다", () => {
    const mapped = profileAllergyLabelsToTutorialItems(["아목시실린캡슐"], {
      아목시실린캡슐: {
        type: "ATC_GROUP",
        value: "J01CA04",
        name: "아목시실린캡슐",
      },
    });

    expect(mapped).toEqual([{ type: "ATC_GROUP", value: "J01CA04", name: "아목시실린캡슐" }]);
  });

  it("프로필 수정 알러지 라벨을 API 허용 객체 배열로 변환한다", () => {
    const mapped = profileAllergyLabelsToPatchItems([
      "국소용 항생제",
      "해산물",
      "직접입력알러지",
      "국소용 항생제",
    ]);

    expect(mapped).toEqual([
      { type: "ATC_GROUP", value: "D06A", name: "국소용 항생제" },
      { type: "FOOD", value: "해산물", name: "해산물" },
    ]);
  });

  it("기저질환 라벨을 diseaseCodes로 변환한다", () => {
    expect(chronicConditionLabelsToDiseaseCodes(["고혈압", "직접입력"])).toEqual(["COND002"]);
  });

  it("검색으로 선택한 기저질환은 매핑된 diseaseCode로 변환한다", () => {
    expect(chronicConditionLabelsToDiseaseCodes(["천식", "편두통"], { 편두통: "G43" })).toEqual([
      "COND010",
      "G43",
    ]);
  });

  it("백엔드가 기대하는 튜토리얼 요청 바디 형태로 변환한다", () => {
    const body = userToTutorialRegistrationBody(baseUser);

    expect(body).toEqual({
      birthDate: "1990-01-01",
      gender: "FEMALE",
      height: 170,
      weight: 65,
      bloodType: "AB",
      rhType: "PLUS",
      diseaseCodes: ["COND010"],
      allergies: expect.arrayContaining([
        { type: "ATC_GROUP", value: "D06A", name: "국소용 항생제" },
        { type: "FOOD", value: "해산물", name: "해산물" },
        { type: "FOOD", value: "직접입력알러지", name: "직접입력알러지" },
      ]),
    });
  });

  it("질환/알러지가 없으면 선택 필드 배열을 생략한다", () => {
    const body = userToTutorialRegistrationBody({
      ...baseUser,
      allergies: [],
      chronicConditions: [],
      bloodType: null,
      gender: "male",
      birthDate: "1990-01-01",
      height: null,
      weight: null,
    });

    expect(body).toEqual({
      birthDate: "1990-01-01",
      gender: "MALE",
      height: undefined,
      weight: undefined,
      bloodType: undefined,
      rhType: undefined,
      diseaseCodes: undefined,
      allergies: undefined,
    });
  });

  it("Rh 정보가 없는 혈액형은 rhType을 추정하지 않는다", () => {
    const body = userToTutorialRegistrationBody({
      ...baseUser,
      bloodType: "AB",
    });

    expect(body.bloodType).toBe("AB");
    expect(body.rhType).toBeUndefined();
  });

  it("생년월일이 없으면 요청 바디 변환에 실패한다", () => {
    expect(() =>
      userToTutorialRegistrationBody({
        ...baseUser,
        birthDate: null,
      }),
    ).toThrow("튜토리얼 등록에는 생년월일이 필요합니다.");
  });
});
