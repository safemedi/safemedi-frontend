import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type { DrugSearchItem, DrugSearchPage } from "@/api/types";
import { apiConfig } from "@/constants/api-config";

const MIN_SEARCH_KEYWORD_LENGTH = 2;

/** 무한스크롤 한 페이지 조회 개수 */
export const DRUG_SEARCH_PAGE_SIZE = 10;

const DRUG_SEARCH_FALLBACK_MOCKS: readonly DrugSearchItem[] = [
  {
    drugCode: "202000123",
    atcCode: "J01CA04",
    drugName: "종근당아목시실린캡슐500mg",
    company: "종근당",
  },
  {
    drugCode: "202000124",
    atcCode: "J01CA04",
    drugName: "보령아목시실린캡슐",
    company: "보령제약",
  },
  { drugCode: "202000125", atcCode: "J01CA04", drugName: "아목시실린시럽", company: "유한양행" },
  { drugCode: "195700007", atcCode: "N02BE01", drugName: "타이레놀정500mg", company: "한국얀센" },
  {
    drugCode: "200001234",
    atcCode: "A02BC01",
    drugName: "오메프라졸캡슐20mg",
    company: "한미약품",
  },
] as const;

export interface SearchDrugsParams {
  readonly keyword: string;
  readonly page?: number;
  readonly size?: number;
}

function buildEmptyPage(page: number, size: number): DrugSearchPage {
  return { content: [], page, size, isLast: true };
}

function filterDrugSearchMocks(keyword: string): readonly DrugSearchItem[] {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (normalizedKeyword.length < MIN_SEARCH_KEYWORD_LENGTH) {
    return [];
  }
  return DRUG_SEARCH_FALLBACK_MOCKS.filter((item) =>
    item.drugName.toLowerCase().includes(normalizedKeyword),
  );
}

function buildDrugSearchMockPage(keyword: string, page: number, size: number): DrugSearchPage {
  const matched = filterDrugSearchMocks(keyword);
  const start = page * size;
  const content = matched.slice(start, start + size);
  return { content, page, size, isLast: start + size >= matched.length };
}

export async function searchDrugs(params: SearchDrugsParams): Promise<DrugSearchPage> {
  const keyword = params.keyword.trim();
  const page = params.page ?? 0;
  const size = params.size ?? DRUG_SEARCH_PAGE_SIZE;

  if (keyword.length < MIN_SEARCH_KEYWORD_LENGTH) {
    return buildEmptyPage(page, size);
  }

  try {
    return await api
      .get(apiPaths.drugsSearch, {
        searchParams: { keyword, page: String(page), size: String(size) },
      })
      .json<DrugSearchPage>();
  } catch (error) {
    if (apiConfig.useMock) {
      return buildDrugSearchMockPage(keyword, page, size);
    }
    throw error;
  }
}
