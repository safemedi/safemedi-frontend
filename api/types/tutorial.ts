/** POST /api/v1/users/me/tutorial */

export type TutorialGender = "MALE" | "FEMALE";

export type TutorialBloodType = "A" | "B" | "O" | "AB";

export type TutorialRhType = "PLUS" | "MINUS";

export type TutorialAllergyType = "ATC_GROUP" | "INGREDIENT" | "FOOD";

export type TutorialAllergyItem = {
  type: TutorialAllergyType;
  value: string;
  name: string;
};

export type TutorialRegistrationBody = {
  birthDate: string;
  gender: TutorialGender;
  height?: number;
  weight?: number;
  bloodType?: TutorialBloodType;
  rhType?: TutorialRhType;
  diseaseCodes?: string[];
  allergies?: TutorialAllergyItem[];
};

export type TutorialRegistrationResponse = {
  message: string;
  isTutorialCompleted: boolean;
};
