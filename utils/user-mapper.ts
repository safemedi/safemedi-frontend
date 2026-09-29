import type {
  TutorialAllergyItem,
  TutorialBloodType,
  TutorialRegistrationBody,
  TutorialRhType,
} from "@/api/types/tutorial";
import type { UserProfile, UserProfilePatchAllergyItem } from "@/api/types/user";
import {
  chronicConditionOptions,
  type RepresentativeAllergyOption,
  representativeFoodAllergyOptions,
  representativeMedicineAllergyOptions,
} from "@/constants/health-profile-options";
import type { User } from "@/stores/userStore";
import { splitBloodTypeWithRh } from "@/utils/blood-type";

const SUPPORTED_BLOOD_TYPES = [
  "A",
  "B",
  "O",
  "AB",
  "A+",
  "A-",
  "B+",
  "B-",
  "O+",
  "O-",
  "AB+",
  "AB-",
] as const;

const TUTORIAL_BLOOD_TYPES: readonly TutorialBloodType[] = ["A", "B", "O", "AB"];

function findRepresentativeMedicineAllergy(label: string): RepresentativeAllergyOption | undefined {
  return representativeMedicineAllergyOptions.find((option) => option.label === label);
}

function findRepresentativeFoodAllergy(label: string): RepresentativeAllergyOption | undefined {
  return representativeFoodAllergyOptions.find((option) => option.label === label);
}

function findRepresentativeAllergyByCodeOrName(
  code: string,
  name: string,
): RepresentativeAllergyOption | undefined {
  const options = [...representativeMedicineAllergyOptions, ...representativeFoodAllergyOptions];
  return options.find(
    (option) =>
      option.label === name ||
      option.name === name ||
      option.value === code ||
      option.label === code,
  );
}

function inferAllergyType(code: string, name: string): TutorialAllergyItem["type"] {
  if (code.startsWith("M")) return "INGREDIENT";
  if (/^[A-Z]\d/.test(code)) return "ATC_GROUP";
  if (code === name) return "FOOD";
  return "ATC_GROUP";
}

function createUniqueAllergyLabels(items: readonly string[]): string[] {
  const seen = new Set<string>();
  const next: string[] = [];

  for (const item of items) {
    const normalized = item.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    next.push(normalized);
  }

  return next;
}

export function buildUserAllergyEditState(
  allergies: readonly string[],
  allergyMappings: Readonly<Record<string, TutorialAllergyItem>> = {},
): {
  labels: string[];
  mappings: Record<string, UserProfilePatchAllergyItem>;
} {
  const mappings: Record<string, UserProfilePatchAllergyItem> = { ...allergyMappings };
  const seen = new Set<string>();
  const labels: string[] = [];

  const addLabel = (label: string) => {
    if (!label || seen.has(label)) return;
    seen.add(label);
    labels.push(label);
  };

  for (const item of createUniqueAllergyLabels(allergies)) {
    const representative =
      findRepresentativeMedicineAllergy(item) ??
      findRepresentativeFoodAllergy(item) ??
      findRepresentativeAllergyByCodeOrName(item, item);

    if (representative) {
      addLabel(representative.label);
      continue;
    }

    addLabel(item);
    if (!mappings[item]) {
      mappings[item] = {
        type: "FOOD",
        value: item,
        name: item,
      };
    }
  }

  for (const label of Object.keys(allergyMappings)) {
    addLabel(label);
  }

  return { labels, mappings };
}

function profileAllergiesToUserFields(
  allergies: UserProfile["allergies"],
): Pick<User, "allergies" | "allergyMappings"> {
  if (!allergies?.length) {
    return { allergies: [] };
  }

  const seedLabels: string[] = [];
  const seedMappings: Record<string, TutorialAllergyItem> = {};

  for (const allergy of allergies) {
    const representative = findRepresentativeAllergyByCodeOrName(allergy.code, allergy.name);
    if (representative) {
      seedLabels.push(representative.label);
      continue;
    }

    const label = allergy.name || allergy.code;
    if (!label) continue;

    seedLabels.push(label);
    seedMappings[label] = {
      type: inferAllergyType(allergy.code, allergy.name),
      value: allergy.code || label,
      name: allergy.name || label,
    };
  }

  const { labels, mappings } = buildUserAllergyEditState(seedLabels, seedMappings);

  return {
    allergies: labels,
    ...(Object.keys(mappings).length > 0 ? { allergyMappings: mappings } : {}),
  };
}

function findChronicCondition(label: string) {
  return chronicConditionOptions.find((option) => option.label === label);
}

function findChronicConditionByCodeOrName(code: string, name: string) {
  return chronicConditionOptions.find(
    (option) => option.code === code || option.label === name || option.label === code,
  );
}

function profileDiseasesToUserFields(
  diseases: UserProfile["diseases"],
): Pick<User, "chronicConditions" | "chronicConditionMappings"> {
  if (!diseases?.length) {
    return { chronicConditions: [] };
  }

  const labels: string[] = [];
  const mappings: Record<string, string> = {};
  const seen = new Set<string>();

  for (const disease of diseases) {
    const representative = findChronicConditionByCodeOrName(disease.code, disease.name);
    const label = representative?.label ?? disease.name ?? disease.code;
    const code = disease.code ?? representative?.code ?? label;

    if (!label || seen.has(label)) continue;
    seen.add(label);
    labels.push(label);

    if (code) {
      mappings[label] = code;
    }
  }

  return {
    chronicConditions: labels,
    ...(Object.keys(mappings).length > 0 ? { chronicConditionMappings: mappings } : {}),
  };
}

function toTutorialBloodType(value: string | undefined): TutorialBloodType | undefined {
  if (!value) return undefined;
  return TUTORIAL_BLOOD_TYPES.includes(value as TutorialBloodType)
    ? (value as TutorialBloodType)
    : undefined;
}

function toTutorialRhType(
  bloodType: User["bloodType"],
  rhFactor: ReturnType<typeof splitBloodTypeWithRh>["rhFactor"],
): TutorialRhType | undefined {
  if (rhFactor === "positive") return "PLUS";
  if (rhFactor === "negative") return "MINUS";
  if (bloodType?.endsWith("+")) return "PLUS";
  if (bloodType?.endsWith("-")) return "MINUS";
  return undefined;
}

export function profileAllergyLabelsToApiCodes(labels: string[]): string[] {
  const codes = new Set<string>();
  for (const label of labels) {
    const representative =
      findRepresentativeMedicineAllergy(label) ?? findRepresentativeFoodAllergy(label);
    if (representative) {
      codes.add(representative.value);
    }
  }
  return [...codes];
}

export function profileAllergyLabelsToPatchItems(
  labels: string[],
  mappedItems: Readonly<Record<string, UserProfilePatchAllergyItem>> = {},
): UserProfilePatchAllergyItem[] {
  const items = new Map<string, UserProfilePatchAllergyItem>();

  for (const label of labels) {
    const selectedItem = mappedItems[label];
    if (selectedItem) {
      items.set(`${selectedItem.type}:${selectedItem.value}`, selectedItem);
      continue;
    }

    const mapped = findRepresentativeMedicineAllergy(label) ?? findRepresentativeFoodAllergy(label);
    if (mapped) {
      const item: UserProfilePatchAllergyItem = {
        type: mapped.type,
        value: mapped.value,
        name: mapped.name,
      };
      items.set(`${item.type}:${item.value}`, item);
    }
  }

  return [...items.values()];
}

export function profileAllergyLabelsToTutorialItems(
  labels: string[],
  mappedItems: Readonly<Record<string, TutorialAllergyItem>> = {},
): TutorialAllergyItem[] {
  const items = new Map<string, TutorialAllergyItem>();

  for (const label of labels) {
    const selectedItem = mappedItems[label];
    if (selectedItem) {
      items.set(`${selectedItem.type}:${selectedItem.value}`, selectedItem);
      continue;
    }

    const medicine = findRepresentativeMedicineAllergy(label);
    if (medicine) {
      const item: TutorialAllergyItem = {
        type: medicine.type,
        value: medicine.value,
        name: medicine.name,
      };
      items.set(`${item.type}:${item.value}`, item);
      continue;
    }

    const food = findRepresentativeFoodAllergy(label);
    if (food) {
      const item: TutorialAllergyItem = {
        type: food.type,
        value: food.value,
        name: food.name,
      };
      items.set(`${item.type}:${item.value}`, item);
      continue;
    }

    const item: TutorialAllergyItem = { type: "FOOD", value: label, name: label };
    items.set(`${item.type}:${item.value}`, item);
  }

  return [...items.values()];
}

export function chronicConditionLabelsToDiseaseCodes(
  labels: string[],
  mappedCodes: Readonly<Record<string, string>> = {},
): string[] {
  const codes = new Set<string>();
  for (const label of labels) {
    const mappedCode = mappedCodes[label];
    if (mappedCode) {
      codes.add(mappedCode);
      continue;
    }

    const option = findChronicCondition(label);
    if (option) {
      codes.add(option.code);
    }
  }
  return [...codes];
}

export function profileToUser(profile: UserProfile): User {
  const normalizedBloodType = profile.bloodType?.toUpperCase() ?? null;
  const supportedBloodType =
    normalizedBloodType &&
    SUPPORTED_BLOOD_TYPES.includes(normalizedBloodType as (typeof SUPPORTED_BLOOD_TYPES)[number])
      ? (normalizedBloodType as User["bloodType"])
      : null;

  const gender: User["gender"] =
    profile.gender === "M" ? "male" : profile.gender === "F" ? "female" : null;

  const allergyFields = profileAllergiesToUserFields(profile.allergies);
  const diseaseFields = profileDiseasesToUserFields(profile.diseases);

  return {
    id: "me",
    displayName: profile.displayName,
    email: null,
    birthDate: profile.birthDate,
    height: profile.height,
    weight: profile.weight,
    gender,
    bloodType: supportedBloodType,
    ...allergyFields,
    ...diseaseFields,
    isTutorial: profile.isTutorialCompleted,
  };
}

export function userToTutorialRegistrationBody(user: User): TutorialRegistrationBody {
  if (!user.birthDate) {
    throw new Error("튜토리얼 등록에는 생년월일이 필요합니다.");
  }

  const { bloodType: baseBloodType, rhFactor } = splitBloodTypeWithRh(user.bloodType);
  const tutorialBloodType = toTutorialBloodType(baseBloodType);
  const tutorialRhType = toTutorialRhType(user.bloodType, rhFactor);
  const diseaseCodes = chronicConditionLabelsToDiseaseCodes(
    user.chronicConditions,
    user.chronicConditionMappings,
  );

  return {
    birthDate: user.birthDate,
    gender: user.gender === "female" ? "FEMALE" : "MALE",
    height: user.height != null ? Math.round(user.height) : undefined,
    weight: user.weight != null ? Math.round(user.weight) : undefined,
    bloodType: tutorialBloodType,
    rhType: tutorialRhType,
    diseaseCodes: diseaseCodes.length ? diseaseCodes : undefined,
    allergies: user.allergies.length
      ? profileAllergyLabelsToTutorialItems(user.allergies, user.allergyMappings)
      : undefined,
  };
}
