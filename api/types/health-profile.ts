export type DrugAllergySearchItem = {
  allergyType: "ATC_GROUP" | "INGREDIENT" | "FOOD";
  allergyValue: string;
  allergyName: string;
};

export type DrugAllergySearchPage = {
  content: DrugAllergySearchItem[];
  page: number;
  size: number;
  isLast: boolean;
};

export type DiseaseSearchItem = {
  diseaseCode: string;
  diseaseName: string;
};

export type DiseaseSearchPage = {
  content: DiseaseSearchItem[];
  page: number;
  size: number;
  isLast: boolean;
};
