import {
  BLOOD_TYPES,
  type BloodTypeOptionValue,
  type RhFactorOptionValue,
} from "@/constants/health-profile-options";

type SplitBloodTypeResult = {
  bloodType?: BloodTypeOptionValue;
  rhFactor?: RhFactorOptionValue;
};

type BloodTypeWithRhValue = `${BloodTypeOptionValue}${"+" | "-"}`;

function isBloodTypeOptionValue(value: string): value is BloodTypeOptionValue {
  return BLOOD_TYPES.includes(value as BloodTypeOptionValue);
}

export function splitBloodTypeWithRh(value: string | null | undefined): SplitBloodTypeResult {
  const raw = (value ?? "").toUpperCase().trim();
  if (!raw) return {};

  const baseBloodType = raw.replace("+", "").replace("-", "");

  return {
    bloodType: isBloodTypeOptionValue(baseBloodType) ? baseBloodType : undefined,
    rhFactor: raw.endsWith("-") ? "negative" : raw.endsWith("+") ? "positive" : undefined,
  };
}

export function splitBloodTypeWithRhOrDefault(
  value: string | null | undefined,
  defaultValue: { bloodType: BloodTypeOptionValue; rhFactor: RhFactorOptionValue } = {
    bloodType: "O",
    rhFactor: "positive",
  },
): { bloodType: BloodTypeOptionValue; rhFactor: RhFactorOptionValue } {
  const split = splitBloodTypeWithRh(value);
  return {
    bloodType: split.bloodType ?? defaultValue.bloodType,
    rhFactor: split.rhFactor ?? defaultValue.rhFactor,
  };
}

export function combineBloodTypeWithRh(
  bloodType: BloodTypeOptionValue,
  rhFactor: RhFactorOptionValue,
): BloodTypeWithRhValue {
  const rhSign = rhFactor === "negative" ? "-" : "+";
  return `${bloodType}${rhSign}`;
}
