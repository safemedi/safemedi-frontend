import type { AllergyItem, DiseaseItem, UserProfile } from "@/api/types/user";

type RawUserMeResponse = {
  displayName?: string | null;
  nickname?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
  bloodType?: string | null;
  rhType?: string | null;
  diseases?: unknown;
  allergies?: unknown;
  isTutorialCompleted?: boolean;
};

function normalizeGender(gender: string | null | undefined): UserProfile["gender"] {
  if (!gender) return null;
  const upper = gender.toUpperCase();
  if (upper === "M" || upper === "MALE") return "M";
  if (upper === "F" || upper === "FEMALE") return "F";
  return null;
}

function combineBloodTypeFromApi(
  bloodType: string | null | undefined,
  rhType: string | null | undefined,
): string | null {
  if (!bloodType) return null;

  const normalized = bloodType.toUpperCase();
  if (normalized.includes("+") || normalized.includes("-")) {
    return normalized;
  }

  const base = normalized.replace(/[+-]/g, "");
  if (rhType === "PLUS") return `${base}+`;
  if (rhType === "MINUS") return `${base}-`;
  return base;
}

function normalizeAllergies(allergies: unknown): AllergyItem[] | null {
  if (!Array.isArray(allergies)) return null;
  if (allergies.length === 0) return [];

  const items: AllergyItem[] = [];
  for (const entry of allergies) {
    if (typeof entry === "string") {
      items.push({ code: entry, name: entry });
      continue;
    }
    if (entry && typeof entry === "object") {
      const record = entry as Record<string, unknown>;
      const name =
        typeof record.name === "string"
          ? record.name
          : typeof record.allergyName === "string"
            ? record.allergyName
            : "";
      const code =
        typeof record.code === "string"
          ? record.code
          : typeof record.value === "string"
            ? record.value
            : typeof record.allergyValue === "string"
              ? record.allergyValue
              : name;
      if (name || code) {
        items.push({ code, name: name || code });
      }
    }
  }

  return items;
}

function normalizeDiseases(diseases: unknown): DiseaseItem[] | null {
  if (!Array.isArray(diseases)) return null;
  if (diseases.length === 0) return [];

  const items: DiseaseItem[] = [];
  for (const entry of diseases) {
    if (typeof entry === "string") {
      items.push({ code: entry, name: entry });
      continue;
    }
    if (entry && typeof entry === "object") {
      const record = entry as Record<string, unknown>;
      const name =
        typeof record.name === "string"
          ? record.name
          : typeof record.diseaseName === "string"
            ? record.diseaseName
            : "";
      const code =
        typeof record.code === "string"
          ? record.code
          : typeof record.diseaseCode === "string"
            ? record.diseaseCode
            : typeof record.value === "string"
              ? record.value
              : name;
      if (name || code) {
        items.push({ code, name: name || code });
      }
    }
  }

  return items;
}

/** GET /users/me 실제 응답(nickname, rhType 분리 등)을 앱 `UserProfile`로 정규화 */
export function normalizeUserProfile(raw: RawUserMeResponse): UserProfile {
  return {
    displayName: raw.displayName ?? raw.nickname ?? null,
    birthDate: raw.birthDate ?? null,
    gender: normalizeGender(raw.gender),
    height: raw.height ?? null,
    weight: raw.weight ?? null,
    bloodType: combineBloodTypeFromApi(raw.bloodType, raw.rhType),
    diseases: normalizeDiseases(raw.diseases),
    allergies: normalizeAllergies(raw.allergies),
    isTutorialCompleted: raw.isTutorialCompleted ?? false,
  };
}
