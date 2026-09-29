import { z } from "zod";
import { tutorialBasicInfoSchema } from "@/features/tutorial/schema";

export const profileEditSchema = tutorialBasicInfoSchema.extend({
  displayName: z
    .string()
    .trim()
    .min(1, "닉네임을 입력해주세요.")
    .max(20, "닉네임은 20자 이하로 입력해주세요."),
  allergies: z.array(z.string().trim().min(1)),
  chronicConditions: z.array(z.string().trim().min(1)),
  allergyInput: z.string(),
  chronicInput: z.string(),
});

export type ProfileEditFormValues = z.infer<typeof profileEditSchema>;
