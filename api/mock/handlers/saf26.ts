import type { MockRegistry } from "@/api/mock/registry";
import { mockState } from "@/api/mock/state";
import { apiPaths } from "@/api/paths";
import type { UpdateUserProfileBody } from "@/api/types/user";

const SUPPORTED_PROVIDERS = new Set(["kakao", "naver"]);

const RX = {
  authLogin: /^\/api\/v1\/auth\/login\/([^/]+)$/,
  familyId: /^\/api\/v1\/families\/(\d+)$/,
  familyInvitation: /^\/api\/v1\/family-invitations\/([^/]+)$/,
  familyInvitationAccept: /^\/api\/v1\/family-invitations\/([^/]+)\/accept$/,
  prescriptionId: /^\/api\/v1\/prescriptions\/(\d+)$/,
  medicationRecordId: /^\/api\/v1\/medication-records\/(\d+)$/,
};

function parsePathId(path: string, rx: RegExp): number | undefined {
  const m = path.match(rx);
  return m?.[1] ? Number(m[1]) : undefined;
}

function parsePathToken(path: string, rx: RegExp): string | undefined {
  return path.match(rx)?.[1];
}

function clonePrescriptions() {
  return mockState.prescriptions.map((prescription) => ({
    ...prescription,
    medications: prescription.medications.map((medication) => ({
      ...medication,
      takeTimes: [...medication.takeTimes],
    })),
  }));
}

function extractAboBloodType(
  value: string | null | undefined,
): NonNullable<UpdateUserProfileBody["bloodType"]> {
  const [abo] = value?.match(/^[A-Z]+/) ?? [];
  return abo === "A" || abo === "B" || abo === "O" || abo === "AB" ? abo : "O";
}

function addDaysToDateText(dateText: string, days: number): string {
  const parsedDate = new Date(`${dateText}T00:00:00`);
  parsedDate.setDate(parsedDate.getDate() + days);
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildMockDailyCompliance(startDate: string, endDate: string) {
  const dailyRates = [
    { takenCount: 17, totalCount: 20 },
    { takenCount: 9, totalCount: 10 },
    { takenCount: 3, totalCount: 4 },
    { takenCount: 19, totalCount: 20 },
    { takenCount: 4, totalCount: 5 },
    { takenCount: 5, totalCount: 5 },
    { takenCount: 9, totalCount: 10 },
  ];

  const entries = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    const rate = dailyRates[entries.length % dailyRates.length];
    entries.push({
      date: currentDate,
      takenCount: rate.takenCount,
      totalCount: rate.totalCount,
      fraction: `${rate.takenCount}/${rate.totalCount}`,
    });
    currentDate = addDaysToDateText(currentDate, 1);
  }

  return entries;
}

export function registerSaf26Mocks(registry: MockRegistry): void {
  // --- Auth ---
  registry.registerMatch(
    "POST",
    (p) => RX.authLogin.test(p),
    async (ctx) => {
      const provider = ctx.path.match(RX.authLogin)?.[1];
      if (!provider || !SUPPORTED_PROVIDERS.has(provider)) {
        return Response.json(
          { code: "AUTH_002", message: "지원하지 않는 소셜 로그인 제공자입니다." },
          { status: 400 },
        );
      }

      const body = ctx.jsonBody as { accessToken?: string } | undefined;

      if (body?.accessToken === "server_error") {
        return Response.json(
          { code: "SYS_500", message: "소셜 인증 서버와의 통신에 실패했습니다." },
          { status: 500 },
        );
      }

      if (mockState.userDeleted || body?.accessToken === "invalid") {
        return Response.json(
          { code: "AUTH_001", message: "유효하지 않거나 만료된 소셜 토큰입니다." },
          { status: 401 },
        );
      }

      return {
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock",
        refreshToken: "mock-refresh-token",
        isTutorialCompleted: mockState.profile.isTutorialCompleted,
      };
    },
    { label: "POST /api/v1/auth/login/:provider" },
  );

  registry.register("POST", apiPaths.authReissue, async (ctx) => {
    const body = ctx.jsonBody as { refreshToken?: string } | undefined;
    if (!body?.refreshToken) {
      return Response.json(
        { code: "VAL_001", message: "필수 입력값(refreshToken)이 누락되었거나 비어있습니다." },
        { status: 400 },
      );
    }
    if (body.refreshToken === "expired") {
      return Response.json(
        { code: "AUTH_003", message: "만료된 refreshToken입니다. 다시 로그인해주세요." },
        { status: 401 },
      );
    }
    if (body.refreshToken !== "mock-refresh-token") {
      return Response.json(
        { code: "AUTH_002", message: "유효하지 않은 refreshToken입니다." },
        { status: 401 },
      );
    }
    return {
      accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-reissued",
      refreshToken: "mock-refresh-token",
    };
  });

  // --- User: tutorial (구체 경로를 /users/me 보다 먼저 등록) ---
  registry.register(
    "POST",
    apiPaths.usersMeTutorial,
    async (ctx) => {
      if (mockState.profile.isTutorialCompleted) {
        return Response.json(
          { code: "TUT_001", message: "이미 완료된 튜토리얼 중복 요청" },
          { status: 400 },
        );
      }
      const body = ctx.jsonBody as { gender?: string } | undefined;
      if (body.gender !== "MALE" && body.gender !== "FEMALE") {
        return Response.json(
          { code: "VAL_001", message: "성별 값이 올바르지 않습니다. (MALE, FEMALE만 허용)" },
          { status: 400 },
        );
      }
      mockState.profile.isTutorialCompleted = true;
      mockState.tutorialCompleted = true;
      return {
        message: "튜토리얼 정보가 성공적으로 등록되었습니다.",
        isTutorialCompleted: true,
      };
    },
    { status: 201 },
  );

  registry.register("GET", apiPaths.usersMe, () => {
    if (mockState.userDeleted) {
      return Response.json(
        { code: "USER_001", message: "존재하지 않는 사용자 정보" },
        { status: 404 },
      );
    }
    return { ...mockState.profile };
  });

  registry.register("PATCH", apiPaths.usersMe, async (ctx) => {
    const patch = ctx.jsonBody as UpdateUserProfileBody;
    if (patch.nickname !== undefined) {
      mockState.profile.displayName = patch.nickname;
    }
    if (patch.diseaseCodes) {
      mockState.profile.diseases = patch.diseaseCodes.map((code) => ({ code, name: code }));
    }
    if (patch.gender !== undefined) {
      mockState.profile.gender = patch.gender === "FEMALE" ? "F" : "M";
    }
    if (patch.bloodType !== undefined || patch.rhType !== undefined) {
      const abo = patch.bloodType ?? extractAboBloodType(mockState.profile.bloodType);
      const rhSign = patch.rhType === "MINUS" ? "-" : "+";
      mockState.profile.bloodType = `${abo}${rhSign}`;
    }
    if (patch.weight !== undefined) mockState.profile.weight = patch.weight;
    if (patch.height !== undefined) mockState.profile.height = patch.height;
    if (patch.allergies) {
      mockState.profile.allergies = patch.allergies.map((allergy) => {
        const value = allergy.value;
        const existing = mockState.profile.allergies.find(
          (a) => a.code === value || a.name === allergy.name,
        );
        return {
          code: existing?.code ?? value,
          name: existing?.name ?? allergy.name,
        };
      });
    }
    return { ...mockState.profile };
  });

  registry.register("DELETE", apiPaths.usersMe, () => {
    mockState.userDeleted = true;
    return { message: "회원 탈퇴가 정상적으로 완료되었습니다." };
  });

  registry.register("POST", apiPaths.usersDeviceToken, () => ({
    deviceId: 15,
    message: "기기 푸시 토큰이 성공적으로 등록(갱신)되었습니다.",
  }));

  registry.register("POST", apiPaths.authLogout, () => ({
    message: "로그아웃이 성공적으로 진행되었습니다.",
  }));

  // --- Family ---
  registry.register("GET", apiPaths.families, () => ({
    families: mockState.families.map((family) => ({ ...family })),
  }));

  registry.register(
    "POST",
    apiPaths.familyInvitations,
    () => {
      if (!mockState.currentFamilyInvitation) {
        const invitationId = mockState.nextFamilyInvitationId++;
        mockState.currentFamilyInvitation = {
          invitationId,
          inviteUrl: `https://35.223.15.211.nip.io/invite/mock-token-${invitationId}`,
          status: "PENDING",
          createdAt: "2026-07-14T06:00:00Z",
          expiresAt: "2026-07-15T06:00:00Z",
        };
      }
      return { ...mockState.currentFamilyInvitation };
    },
    { status: 201 },
  );

  registry.registerMatch(
    "GET",
    (p) => RX.familyInvitation.test(p),
    (ctx) => {
      const token = parsePathToken(ctx.path, RX.familyInvitation);
      if (!token || token === "invalid") {
        return Response.json(
          { code: "INV_001", message: "존재하지 않거나 유효하지 않은 초대 링크입니다." },
          { status: 404 },
        );
      }
      if (token === "expired") {
        return Response.json(
          { code: "INV_002", message: "만료된 가족 초대 링크입니다." },
          { status: 410 },
        );
      }
      if (token === "used") {
        return Response.json(
          { code: "INV_003", message: "이미 사용된 가족 초대 링크입니다." },
          { status: 409 },
        );
      }
      return {
        inviterName: "홍길동",
        expiresAt: "2026-07-16T06:00:00Z",
      };
    },
    { label: "GET /api/v1/family-invitations/:token" },
  );

  registry.registerMatch(
    "POST",
    (p) => RX.familyInvitationAccept.test(p),
    (ctx) => {
      const token = parsePathToken(ctx.path, RX.familyInvitationAccept);
      if (!token || token === "invalid") {
        return Response.json(
          { code: "INV_001", message: "존재하지 않거나 유효하지 않은 초대 링크입니다." },
          { status: 404 },
        );
      }
      if (token === "expired") {
        return Response.json(
          { code: "INV_002", message: "만료된 가족 초대 링크입니다." },
          { status: 410 },
        );
      }
      if (token === "used") {
        return Response.json(
          { code: "INV_003", message: "이미 사용된 가족 초대 링크입니다." },
          { status: 409 },
        );
      }
      const accepted = {
        familyId: 12,
        name: "홍길동",
        relation: "가족",
        connectedAt: "2026-07-15T06:05:00Z",
      };
      if (!mockState.families.some((family) => family.familyId === accepted.familyId)) {
        mockState.families.push({
          familyId: accepted.familyId,
          name: accepted.name,
          relation: accepted.relation,
        });
      }
      return accepted;
    },
    { label: "POST /api/v1/family-invitations/:token/accept" },
  );

  registry.registerMatch(
    "PATCH",
    (p) => RX.familyId.test(p),
    (ctx) => {
      const id = parsePathId(ctx.path, RX.familyId);
      const body = (ctx.jsonBody ?? {}) as { relation?: string };
      const relation = body.relation?.trim() ?? "";
      const family = mockState.families.find((item) => item.familyId === id);
      if (!id || !family) {
        return Response.json(
          { code: "FAM_002", message: "존재하지 않거나 연동이 해제된 가족입니다." },
          { status: 404 },
        );
      }
      if (relation.length < 1 || relation.length > 20) {
        return Response.json(
          { code: "VAL_008", message: "가족 호칭이 비어 있거나 20자를 초과했습니다." },
          { status: 400 },
        );
      }
      family.relation = relation;
      return {
        familyId: id,
        name: family.name,
        relation,
        updatedAt: "2026-07-15T06:10:00Z",
      };
    },
    { label: "PATCH /api/v1/families/:familyId" },
  );

  registry.registerMatch(
    "DELETE",
    (p) => RX.familyId.test(p),
    (ctx) => {
      const id = parsePathId(ctx.path, RX.familyId);
      const index = mockState.families.findIndex((family) => family.familyId === id);
      if (!id || index === -1) {
        return Response.json(
          { code: "FAM_002", message: "존재하지 않거나 연동이 해제된 가족입니다." },
          { status: 404 },
        );
      }
      mockState.families.splice(index, 1);
      return new Response(null, { status: 204 });
    },
    { label: "DELETE /api/v1/families/:familyId" },
  );

  // --- Drugs ---
  registry.register("GET", apiPaths.drugsSearch, (ctx) => {
    const keyword = ctx.searchParams.get("keyword") ?? "";
    if (keyword.length < 2) {
      return Response.json(
        { code: "VAL_005", message: "검색어는 최소 2글자 이상 입력해야 합니다." },
        { status: 400 },
      );
    }
    const page = Number(ctx.searchParams.get("page") ?? "0");
    const size = Number(ctx.searchParams.get("size") ?? "10");
    const normalizedKeyword = keyword.trim().toLowerCase();
    const allResults = [
      {
        drugCode: "202000123",
        atcCode: "J01CA04",
        drugName: "종근당아목시실린캡슐500mg",
        company: "종근당",
      },
      {
        drugCode: "202000124",
        atcCode: "J01CA04",
        drugName: "보령아목시실린캡슐",
        company: "보령제약",
      },
      {
        drugCode: "202000125",
        atcCode: "J01CA04",
        drugName: "아목시실린시럽",
        company: "유한양행",
      },
    ];
    const matched = allResults.filter((item) =>
      item.drugName.toLowerCase().includes(normalizedKeyword),
    );
    const start = page * size;
    return {
      content: matched.slice(start, start + size),
      page,
      size,
      isLast: start + size >= matched.length,
    };
  });

  registry.register("GET", apiPaths.drugAllergiesSearch, (ctx) => {
    const keyword = ctx.searchParams.get("keyword") ?? "";
    if (keyword.trim().length < 1) {
      return Response.json(
        { code: "VAL_007", message: "약물 알러지 검색어를 입력해야 합니다." },
        { status: 400 },
      );
    }
    const page = Number(ctx.searchParams.get("page") ?? "0");
    const size = Number(ctx.searchParams.get("size") ?? "10");
    const normalizedKeyword = keyword.trim().toLowerCase();
    const allResults = [
      {
        allergyType: "ATC_GROUP",
        allergyValue: "J01C",
        allergyName: "페니실린류 베타락탐계 항박테리아제",
      },
      { allergyType: "ATC_GROUP", allergyValue: "N02", allergyName: "진통제" },
      { allergyType: "ATC_GROUP", allergyValue: "N02B", allergyName: "기타 진통제 및 해열제" },
    ];
    const matched = allResults.filter((item) =>
      item.allergyName.toLowerCase().includes(normalizedKeyword),
    );
    const start = page * size;
    return {
      content: matched.slice(start, start + size),
      page,
      size,
      isLast: start + size >= matched.length,
    };
  });

  registry.register("GET", apiPaths.diseasesSearch, (ctx) => {
    const keyword = ctx.searchParams.get("keyword") ?? "";
    if (keyword.trim().length < 2) {
      return Response.json(
        { code: "VAL_006", message: "기저질환 검색어는 최소 2글자 이상 입력해야 합니다." },
        { status: 400 },
      );
    }
    const page = Number(ctx.searchParams.get("page") ?? "0");
    const size = Number(ctx.searchParams.get("size") ?? "10");
    const normalizedKeyword = keyword.trim().toLowerCase();
    const allResults = [
      { diseaseCode: "I10", diseaseName: "본태성(원발성) 고혈압" },
      { diseaseCode: "I11", diseaseName: "고혈압성 심장병" },
      { diseaseCode: "E11", diseaseName: "2형 당뇨병" },
      { diseaseCode: "J45", diseaseName: "천식" },
    ];
    const matched = allResults.filter((item) =>
      item.diseaseName.toLowerCase().includes(normalizedKeyword),
    );
    const start = page * size;
    return {
      content: matched.slice(start, start + size),
      page,
      size,
      isLast: start + size >= matched.length,
    };
  });

  // --- Prescriptions ---
  registry.register("GET", apiPaths.prescriptions, () => ({
    content: clonePrescriptions().map((prescription) => ({
      prescriptionId: prescription.prescriptionId,
      title: prescription.title,
      createdAt: prescription.createdAt ?? "2026-03-11",
      drugCount: prescription.medications.length,
      hasAllergyConflict: prescription.medications.some((medication) => medication.hasWarning),
    })),
    isLast: true,
  }));

  registry.registerMatch(
    "GET",
    (p) => RX.prescriptionId.test(p),
    (ctx) => {
      const id = parsePathId(ctx.path, RX.prescriptionId);
      const prescription = clonePrescriptions().find((item) => item.prescriptionId === id);
      if (!prescription) {
        return Response.json(
          { code: "MED_005", message: "존재하지 않는 처방전입니다." },
          { status: 404 },
        );
      }
      return {
        prescriptionId: prescription.prescriptionId,
        title: prescription.title,
        startDate: prescription.startDate ?? "2026-06-01",
        endDate: prescription.endDate ?? "2026-06-10",
        isDoctorApproved: prescription.isDoctorApproved ?? true,
        hasAllergyConflict:
          prescription.hasAllergyConflict ??
          prescription.medications.some((medication) => medication.hasWarning),
        medications: prescription.medications.map((medication) => ({
          prescriptionDrugId: medication.prescriptionDrugId ?? medication.medicationId,
          drugCode: medication.drugCode ?? medication.atcCode,
          atcCode: medication.atcCode,
          drugName: medication.drugName,
          takeTimes: medication.takeTimes,
          mainIngredient: medication.mainIngredient,
          hasWarning: medication.hasWarning,
          warningMessage: medication.warningMessage,
        })),
      };
    },
    { label: "GET /api/v1/prescriptions/:prescriptionId" },
  );

  registry.register(
    "POST",
    apiPaths.prescriptions,
    async (ctx) => {
      const body = ctx.jsonBody as {
        title?: string;
        startDate?: string;
        endDate?: string;
        medications?: {
          drugCode: string;
          atcCode: string;
          drugName: string;
          takeTimes?: string[];
        }[];
      };
      if (!body?.medications?.length) {
        return Response.json(
          { code: "MED_002", message: "약물 목록(medications)이 비어있음" },
          { status: 400 },
        );
      }
      if (!body?.title || body.title.trim().length === 0) {
        return Response.json(
          { code: "MED_004", message: "처방전 제목(title)을 입력해 주세요." },
          { status: 400 },
        );
      }
      if (body.startDate && body.endDate && body.endDate < body.startDate) {
        return Response.json(
          { code: "MED_001", message: "종료일은 시작일보다 빠를 수 없습니다." },
          { status: 400 },
        );
      }
      const id = mockState.prescriptionIdSeq++;
      const medications = body.medications.map((medication) => {
        const hasWarning = mockState.profile.allergies.some((a) =>
          medication.atcCode.startsWith(a.code),
        );
        return {
          medicationId: mockState.medicationIdSeq,
          prescriptionDrugId: mockState.medicationIdSeq++,
          drugCode: medication.drugCode,
          atcCode: medication.atcCode,
          drugName: medication.drugName,
          takeTimes: medication.takeTimes ?? [],
          mainIngredient: medication.drugName,
          hasWarning,
          warningMessage: hasWarning
            ? "알러지 충돌이 발견되었습니다. 의사와 상담 후 복용하세요."
            : null,
        };
      });
      const conflict = medications.some((medication) => medication.hasWarning);
      mockState.prescriptions.push({
        prescriptionId: id,
        title: body.title,
        startDate: body.startDate,
        endDate: body.endDate,
        isDoctorApproved: true,
        hasAllergyConflict: conflict,
        medications,
      });
      if (conflict) {
        return {
          prescriptionId: id,
          title: body.title ?? "",
          message: "처방전이 등록되었습니다. 단, 알러지 충돌이 발견되었습니다.",
          hasAllergyConflict: true,
          allergyWarnings: [
            {
              atcCode: "J01CA04",
              drugName: "아목시실린 캡슐",
              conflictWith: "페니실린계 항생제",
              warningMessage: "등록하신 '페니실린계 항생제' 알러지와 충돌하는 성분입니다.",
            },
          ],
        };
      }
      return {
        prescriptionId: id,
        title: body.title ?? "안과 인공눈물",
        message: "처방전이 안전하게 등록되었습니다.",
        hasAllergyConflict: false,
        allergyWarnings: [],
      };
    },
    { status: 201 },
  );

  registry.registerMatch(
    "DELETE",
    (p) => RX.prescriptionId.test(p),
    (ctx) => {
      const id = parsePathId(ctx.path, RX.prescriptionId);
      const index = mockState.prescriptions.findIndex(
        (prescription) => prescription.prescriptionId === id,
      );
      if (index < 0) {
        return Response.json(
          { code: "MED_005", message: "존재하지 않는 처방전입니다." },
          { status: 404 },
        );
      }
      mockState.prescriptions.splice(index, 1);
      return { message: "처방전 및 예정된 복약 스케줄이 성공적으로 삭제되었습니다." };
    },
    { label: "DELETE /api/v1/prescriptions/:prescriptionId" },
  );

  registry.registerMatch(
    "PATCH",
    (p) => RX.prescriptionId.test(p),
    (ctx) => {
      const id = parsePathId(ctx.path, RX.prescriptionId);
      const body = ctx.jsonBody as {
        title?: string;
        medications?: { prescriptionDrugId: number; takeTimes: string[] }[];
      };
      const prescription = mockState.prescriptions.find((item) => item.prescriptionId === id);
      if (!prescription) {
        return Response.json(
          { code: "MED_005", message: "존재하지 않는 처방전입니다." },
          { status: 404 },
        );
      }
      const title = body.title ?? prescription.title;
      const medicationUpdates = new Map(
        body.medications?.map((medication) => [medication.prescriptionDrugId, medication]) ?? [],
      );
      const medications = prescription.medications.map((medication) => {
        const prescriptionDrugId = medication.prescriptionDrugId ?? medication.medicationId;
        const update = medicationUpdates.get(prescriptionDrugId);
        if (!update) {
          return medication;
        }
        return {
          ...medication,
          takeTimes: [...update.takeTimes],
        };
      });
      mockState.prescriptions = mockState.prescriptions.map((item) =>
        item.prescriptionId === prescription.prescriptionId
          ? { ...prescription, title, medications }
          : item,
      );
      return {
        prescriptionId: prescription.prescriptionId,
        title,
        message: "처방전 정보와 향후 복약 스케줄이 성공적으로 업데이트되었습니다.",
      };
    },
    { label: "PATCH /api/v1/prescriptions/:prescriptionId" },
  );

  // --- Medication records ---
  registry.registerMatch(
    "PATCH",
    (p) => RX.medicationRecordId.test(p),
    (ctx) => {
      const id = parsePathId(ctx.path, RX.medicationRecordId);
      const body = ctx.jsonBody as { status?: string };
      if (id === 99999) {
        return Response.json(
          { code: "REC_001", message: "존재하지 않는 복약 기록 ID" },
          { status: 404 },
        );
      }
      if (id === 888) {
        return Response.json(
          { code: "REC_002", message: "해당 시간에 이미 복용 처리가 완료된 기록입니다." },
          { status: 409 },
        );
      }
      return {
        recordId: id ?? 500,
        prescriptionId: 10,
        scheduledAt: "2026-04-06T08:00:00",
        takenAt: body?.status === "SUCCESS" ? "2026-04-06T08:05:30" : null,
        status: body?.status ?? "SUCCESS",
      };
    },
    { label: "PATCH /api/v1/medication-records/:recordId" },
  );

  registry.register("GET", apiPaths.medicationRecords, (ctx) => {
    const type = ctx.searchParams.get("type");
    const date = ctx.searchParams.get("date");
    if (!type || !date) {
      return Response.json(
        { code: "VAL_002", message: "Query 파라미터 누락 또는 날짜 포맷 에러" },
        { status: 400 },
      );
    }
    if (type !== "MONTH" && type !== "WEEK" && type !== "DAILY") {
      return Response.json(
        { code: "VAL_002", message: "type은 MONTH, WEEK, DAILY 중 하나여야 합니다." },
        { status: 400 },
      );
    }
    if (type === "MONTH") {
      return {
        type: "MONTH",
        periodStartDate: "2026-04-01",
        periodEndDate: "2026-04-30",
        summary: {
          totalCount: 9,
          takenCount: 8,
          fraction: "8/9",
        },
        dailyRecords: [
          {
            date: "2026-04-06",
            totalCount: 3,
            takenCount: 2,
            fraction: "2/3",
            items: [
              {
                recordId: 500,
                prescriptionTitle: "두통/해열 약물 관리",
                scheduledTime: "08:00",
                status: "SUCCESS",
              },
              {
                recordId: 501,
                prescriptionTitle: "위장 약물 관리",
                scheduledTime: "08:00",
                status: "SUCCESS",
              },
              {
                recordId: 502,
                prescriptionTitle: "혈압 약물 관리",
                scheduledTime: "14:00",
                status: "PENDING",
              },
            ],
          },
        ],
      };
    }
    if (type === "WEEK") {
      return {
        type: "WEEK",
        periodStartDate: "2026-04-06",
        periodEndDate: "2026-04-12",
        summary: {
          totalCount: 21,
          takenCount: 18,
          fraction: "18/21",
        },
        dailyRecords: [],
      };
    }
    return {
      type: "DAILY",
      date,
      summary: { totalCount: 3, takenCount: 1, fraction: "1/3" },
      records: [
        {
          recordId: 500,
          prescriptionTitle: "감기약",
          medicationNames: ["플루티카손 (스프레이)", "타이레놀 500mg"],
          scheduledTime: "08:00",
          takenTime: "08:05",
          status: "SUCCESS",
          isGoldenTime: false,
        },
        {
          recordId: 501,
          prescriptionTitle: "감기약",
          medicationNames: ["플루티카손 (스프레이)", "타이레놀 500mg"],
          scheduledTime: "13:00",
          takenTime: null,
          status: "PENDING",
          isGoldenTime: true,
        },
        {
          recordId: 502,
          prescriptionTitle: "감기약",
          medicationNames: ["플루티카손 (스프레이)", "타이레놀 500mg"],
          scheduledTime: "19:00",
          takenTime: null,
          status: "PENDING",
          isGoldenTime: false,
        },
      ],
    };
  });

  // --- Statistics ---
  registry.register("GET", apiPaths.medicationsStatistics, (ctx) => {
    const start = ctx.searchParams.get("startDate");
    const end = ctx.searchParams.get("endDate");
    if (!start || !end || start > end) {
      return Response.json(
        { code: "VAL_002", message: "시작일이 종료일보다 늦을 수 없습니다." },
        { status: 400 },
      );
    }

    const dailyCompliance = buildMockDailyCompliance(start, end);
    const totalCount = dailyCompliance.reduce((sum, day) => sum + day.totalCount, 0);
    const takenCount = dailyCompliance.reduce((sum, day) => sum + day.takenCount, 0);

    return {
      startDate: start,
      endDate: end,
      totalCount,
      takenCount,
      fraction: `${takenCount}/${totalCount}`,
      dailyCompliance,
    };
  });

  // --- Notifications ---
  registry.register("GET", apiPaths.notificationsSettings, () => ({
    ...mockState.notificationSettings,
  }));

  registry.register("PATCH", apiPaths.notificationsSettings, (ctx) => {
    const body = ctx.jsonBody as Partial<typeof mockState.notificationSettings>;
    Object.assign(mockState.notificationSettings, body, {
      updatedAt: "2026-04-07T10:00:00",
    });
    return { ...mockState.notificationSettings };
  });

  registry.register("GET", apiPaths.notifications, (ctx) => {
    const page = Number(ctx.searchParams.get("page") ?? "0");
    const size = Number(ctx.searchParams.get("size") ?? "20");
    if (page < 0) {
      return Response.json(
        { code: "PAG_001", message: "페이지 번호(page)는 0 이상이어야 합니다." },
        { status: 400 },
      );
    }
    if (size < 1 || size > 100) {
      return Response.json(
        { code: "PAG_002", message: "조회 개수(size)는 1 이상 100 이하이어야 합니다." },
        { status: 400 },
      );
    }
    return mockState.notifications;
  });

  registry.register("GET", apiPaths.notificationsUnreadCount, () => {
    const unreadCount = mockState.notifications.content.filter((item) => !item.isRead).length;
    return { unreadCount };
  });

  registry.register("PATCH", apiPaths.notificationsReadAll, () => {
    let updatedCount = 0;
    for (const item of mockState.notifications.content) {
      if (!item.isRead) {
        item.isRead = true;
        updatedCount += 1;
      }
    }
    return { updatedCount };
  });

  registry.registerMatch(
    "PATCH",
    (pathname) => /\/api\/v1\/notifications\/\d+\/read$/.test(pathname),
    (ctx) => {
      const match = /\/notifications\/(\d+)\/read$/.exec(ctx.url.pathname);
      const notificationId = Number(match?.[1]);
      const item = mockState.notifications.content.find(
        (notification) => notification.notificationId === notificationId,
      );
      if (!item) {
        return Response.json(
          { code: "NOTI_003", message: "존재하지 않는 알림입니다." },
          { status: 404 },
        );
      }
      item.isRead = true;
      return { notificationId: item.notificationId, isRead: true };
    },
    { label: "PATCH /api/v1/notifications/:id/read" },
  );
}
