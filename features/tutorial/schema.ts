import { z } from "zod";
import { BLOOD_TYPES, GENDERS, RH_FACTORS } from "@/constants/health-profile-options";
import { parseCompactBirthDate, parseIsoDate } from "@/utils/date";

export const tutorialBasicInfoSchema = z.object({
  bloodType: z.enum(BLOOD_TYPES, { message: "혈액형을 선택해 주세요" }),
  rhFactor: z.enum(RH_FACTORS, { message: "Rh 타입을 선택해 주세요" }),
  gender: z.enum(GENDERS, { message: "성별을 선택해 주세요" }),
});

const birthDateSchema = z
  .string()
  .trim()
  .min(1, "생년월일을 입력해 주세요")
  .refine((value) => /^\d{6}$/.test(value), "6자리 숫자로 입력해 주세요 (예: 950101)")
  .refine((value) => parseCompactBirthDate(value) != null, "올바른 생년월일을 입력해 주세요")
  .refine((value) => {
    const isoDate = parseCompactBirthDate(value);
    if (!isoDate) {
      return false;
    }

    const parsedDate = parseIsoDate(isoDate);
    if (!parsedDate) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return parsedDate <= today;
  }, "미래 날짜는 입력할 수 없습니다");

export const tutorialStep1Schema = tutorialBasicInfoSchema.extend({
  birthDate: birthDateSchema,
  height: z
    .string()
    .trim()
    .min(1, "키를 입력해 주세요")
    .refine((val) => {
      const n = Number(val.replace(",", "."));
      return !Number.isNaN(n) && n >= 50 && n <= 250;
    }, "50~250cm 사이로 입력해 주세요"),
  weight: z
    .string()
    .trim()
    .min(1, "몸무게를 입력해 주세요")
    .refine((val) => {
      const n = Number(val.replace(",", "."));
      return !Number.isNaN(n) && n >= 10 && n <= 300;
    }, "10~300kg 사이로 입력해 주세요"),
});

export type TutorialStep1FormValues = z.infer<typeof tutorialStep1Schema>;
export type TutorialBasicInfoFormValues = z.infer<typeof tutorialBasicInfoSchema>;
