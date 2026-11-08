import type { UpdateUserProfileBody, UserProfile } from "@/api/types/user";
import { chronicConditionOptions } from "@/constants/health-profile-options";
import type { User } from "@/stores/userStore";

export interface UpdateUserProfileVariables extends UpdateUserProfileBody {
  readonly diseaseNames?: Readonly<Record<string, string>>;
}

export function getProfileFromUser(user: User): UserProfile {
  return {
    displayName: user.displayName,
    birthDate: user.birthDate,
    gender: user.gender === "female" ? "F" : user.gender === "male" ? "M" : null,
    bloodType: user.bloodType,
    height: user.height,
    weight: user.weight,
    isTutorialCompleted: user.isTutorial,
    allergies: user.allergies.map((name) => ({
      code: user.allergyMappings?.[name]?.value ?? name,
      name,
    })),
    diseases: user.chronicConditions.map((name) => ({
      code: user.chronicConditionMappings?.[name] ?? name,
      name,
    })),
  };
}

export function applyOptimisticUserProfile(
  previous: UserProfile,
  body: UpdateUserProfileVariables,
): UserProfile {
  const bloodType = body.bloodType ?? previous.bloodType?.replace(/[+-]$/, "");
  const rh =
    body.rhType === "MINUS"
      ? "-"
      : body.rhType === "PLUS"
        ? "+"
        : previous.bloodType?.endsWith("-")
          ? "-"
          : previous.bloodType?.endsWith("+")
            ? "+"
            : "";
  return {
    ...previous,
    displayName: body.nickname ?? previous.displayName,
    gender: body.gender === "FEMALE" ? "F" : body.gender === "MALE" ? "M" : previous.gender,
    bloodType: bloodType ? `${bloodType}${rh}` : previous.bloodType,
    height: body.height ?? previous.height,
    weight: body.weight ?? previous.weight,
    allergies:
      body.allergies?.map((item) => ({ code: item.value, name: item.name })) ?? previous.allergies,
    diseases:
      body.diseaseCodes?.map((code) => ({
        code,
        name:
          body.diseaseNames?.[code] ??
          previous.diseases?.find((item) => item.code === code)?.name ??
          chronicConditionOptions.find((item) => item.code === code)?.label ??
          code,
      })) ?? previous.diseases,
  };
}
