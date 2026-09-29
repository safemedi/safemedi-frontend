/** 프로필·튜토리얼 등에서 공통으로 쓰는 혈액형 / 성별 선택지 */

export const BLOOD_TYPES = ["A", "B", "O", "AB"] as const;
export type BloodTypeOptionValue = (typeof BLOOD_TYPES)[number];

export const RH_FACTORS = ["positive", "negative"] as const;
export type RhFactorOptionValue = (typeof RH_FACTORS)[number];

export const GENDERS = ["male", "female"] as const;
export type GenderOptionValue = (typeof GENDERS)[number];

export const bloodOptions: readonly { value: BloodTypeOptionValue; label: string }[] = [
  { value: "A", label: "A형" },
  { value: "B", label: "B형" },
  { value: "O", label: "O형" },
  { value: "AB", label: "AB형" },
];

export const rhOptions: readonly { value: RhFactorOptionValue; label: string }[] = [
  { value: "positive", label: "Rh+" },
  { value: "negative", label: "Rh-" },
];

export const genderOptions: readonly { value: GenderOptionValue; label: string }[] = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
];

export type RepresentativeAllergyOption = {
  readonly label: string;
  readonly type: "ATC_GROUP" | "INGREDIENT" | "FOOD";
  readonly value: string;
  readonly name: string;
};

export const representativeMedicineAllergyOptions = [
  {
    label: "기타 진통제 및 해열제",
    type: "ATC_GROUP",
    value: "N02B",
    name: "기타 진통제 및 해열제",
  },
  { label: "국소용 항생제", type: "ATC_GROUP", value: "D06A", name: "국소용 항생제" },
  {
    label: "페니실린류 베타릭탐계 항박테리아제",
    type: "ATC_GROUP",
    value: "J01C",
    name: "페니실린류 베타릭탐계 항박테리아제",
  },
  { label: "기침 및 감기 치료제", type: "ATC_GROUP", value: "R05", name: "기침 및 감기 치료제" },
  {
    label: "요오드화 방사선 조영제",
    type: "ATC_GROUP",
    value: "V08A",
    name: "요오드화 방사선 조영제",
  },
  {
    label: "항경련제",
    type: "ATC_GROUP",
    value: "N03",
    name: "항경련제",
  },
  {
    label: "통풍 치료제",
    type: "ATC_GROUP",
    value: "M04",
    name: "통풍 치료제",
  },
] as const satisfies readonly RepresentativeAllergyOption[];

export const representativeFoodAllergyOptions = [
  { label: "땅콩", type: "FOOD", value: "땅콩", name: "땅콩" },
  { label: "해산물", type: "FOOD", value: "해산물", name: "해산물" },
  { label: "유제품", type: "FOOD", value: "유제품", name: "유제품" },
  { label: "계란", type: "FOOD", value: "계란", name: "계란" },
] as const satisfies readonly RepresentativeAllergyOption[];

export type ChronicConditionOption = {
  readonly emoji: string;
  readonly label: string;
  readonly code: string;
};

export const chronicConditionOptions = [
  { emoji: "❤️", label: "당뇨", code: "COND001" },
  { emoji: "🩸", label: "고혈압", code: "COND002" },
  { emoji: "🫁", label: "천식", code: "COND010" },
  { emoji: "🫘", label: "신장질환", code: "COND013" },
  { emoji: "🫀", label: "간질환", code: "COND012" },
  { emoji: "💓", label: "심장질환", code: "COND004" },
] as const satisfies readonly ChronicConditionOption[];

export const profileEditQuickItems = {
  allergy: [
    ...representativeMedicineAllergyOptions.map((option) => option.label),
    ...representativeFoodAllergyOptions.map((option) => option.label),
  ],
  chronic: chronicConditionOptions.map((option) => option.label),
} as const;
