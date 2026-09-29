import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type {
  DiseaseSearchItem,
  DiseaseSearchPage,
  DrugAllergySearchItem,
  DrugAllergySearchPage,
} from "@/api/types";
import { apiConfig } from "@/constants/api-config";

const MIN_ALLERGY_SEARCH_KEYWORD_LENGTH = 1;
const MIN_DISEASE_SEARCH_KEYWORD_LENGTH = 2;

export const HEALTH_PROFILE_SEARCH_PAGE_SIZE = 10;

const DRUG_ALLERGY_SEARCH_FALLBACK_MOCKS: readonly DrugAllergySearchItem[] = [
  {
    allergyType: "ATC_GROUP",
    allergyValue: "J01C",
    allergyName: "페니실린류 베타락탐계 항박테리아제",
  },
  { allergyType: "ATC_GROUP", allergyValue: "N02", allergyName: "진통제" },
  { allergyType: "ATC_GROUP", allergyValue: "N02B", allergyName: "기타 진통제 및 해열제" },
];

const DISEASE_SEARCH_FALLBACK_MOCKS: readonly DiseaseSearchItem[] = [
  { diseaseCode: "I10", diseaseName: "본태성(원발성) 고혈압" },
  { diseaseCode: "I11", diseaseName: "고혈압성 심장병" },
  { diseaseCode: "E11", diseaseName: "2형 당뇨병" },
  { diseaseCode: "J45", diseaseName: "천식" },
];

export interface SearchHealthProfileParams {
  readonly keyword: string;
  readonly page?: number;
  readonly size?: number;
}

function buildDrugAllergyEmptyPage(page: number, size: number): DrugAllergySearchPage {
  return { content: [], page, size, isLast: true };
}

function buildDiseaseEmptyPage(page: number, size: number): DiseaseSearchPage {
  return { content: [], page, size, isLast: true };
}

function buildMockPage<T>(
  items: readonly T[],
  page: number,
  size: number,
): { content: T[]; page: number; size: number; isLast: boolean } {
  const start = page * size;
  const content = items.slice(start, start + size);
  return { content, page, size, isLast: start + size >= items.length };
}

export async function searchDrugAllergies(
  params: SearchHealthProfileParams,
): Promise<DrugAllergySearchPage> {
  const keyword = params.keyword.trim();
  const page = params.page ?? 0;
  const size = params.size ?? HEALTH_PROFILE_SEARCH_PAGE_SIZE;

  if (keyword.length < MIN_ALLERGY_SEARCH_KEYWORD_LENGTH) {
    return buildDrugAllergyEmptyPage(page, size);
  }

  try {
    return await api
      .get(apiPaths.drugAllergiesSearch, {
        searchParams: { keyword, page: String(page), size: String(size) },
      })
      .json<DrugAllergySearchPage>();
  } catch (error) {
    if (apiConfig.useMock) {
      const matched = DRUG_ALLERGY_SEARCH_FALLBACK_MOCKS.filter((item) =>
        item.allergyName.includes(keyword),
      );
      return buildMockPage(matched, page, size);
    }
    throw error;
  }
}

export async function searchDiseases(
  params: SearchHealthProfileParams,
): Promise<DiseaseSearchPage> {
  const keyword = params.keyword.trim();
  const page = params.page ?? 0;
  const size = params.size ?? HEALTH_PROFILE_SEARCH_PAGE_SIZE;

  if (keyword.length < MIN_DISEASE_SEARCH_KEYWORD_LENGTH) {
    return buildDiseaseEmptyPage(page, size);
  }

  try {
    return await api
      .get(apiPaths.diseasesSearch, {
        searchParams: { keyword, page: String(page), size: String(size) },
      })
      .json<DiseaseSearchPage>();
  } catch (error) {
    if (apiConfig.useMock) {
      const matched = DISEASE_SEARCH_FALLBACK_MOCKS.filter((item) =>
        item.diseaseName.includes(keyword),
      );
      return buildMockPage(matched, page, size);
    }
    throw error;
  }
}
