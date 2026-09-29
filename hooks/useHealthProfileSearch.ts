import { useEffect, useMemo, useRef } from "react";

import { useSearchDiseasesQuery, useSearchDrugAllergiesQuery } from "@/api/queries/health-profile";
import type { DiseaseSearchItem, DrugAllergySearchItem } from "@/api/types";
import { useDebouncedValue } from "./useDebouncedValue";

const DEFAULT_DEBOUNCE_MS = 250;
const MIN_ALLERGY_KEYWORD_LENGTH = 1;
const MIN_DISEASE_KEYWORD_LENGTH = 2;

interface BaseSearchOptions {
  readonly keyword: string;
  readonly debounceMs?: number;
  readonly excludeNames?: readonly string[];
}

export interface UseDrugAllergySearchResult {
  readonly items: readonly DrugAllergySearchItem[];
  readonly isFetching: boolean;
  readonly isFetchingNextPage: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly hasNextPage: boolean;
  readonly isSearchEnabled: boolean;
  readonly loadMore: () => void;
}

export interface UseDiseaseSearchResult {
  readonly items: readonly DiseaseSearchItem[];
  readonly isFetching: boolean;
  readonly isFetchingNextPage: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly hasNextPage: boolean;
  readonly isSearchEnabled: boolean;
  readonly loadMore: () => void;
}

function useFilteredInfiniteSearch<T>({
  keyword,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  excludeNames,
  minKeywordLength,
  getItemName,
  useQuery,
}: BaseSearchOptions & {
  readonly minKeywordLength: number;
  readonly getItemName: (item: T) => string;
  readonly useQuery: (
    keyword: string,
    enabled: boolean,
  ) => {
    readonly items: readonly T[];
    readonly isFetching: boolean;
    readonly isFetchingNextPage: boolean;
    readonly isError: boolean;
    readonly error: Error | null;
    readonly hasNextPage: boolean;
    readonly fetchNextPage: () => void;
  };
}) {
  const debouncedKeyword = useDebouncedValue(keyword.trim(), debounceMs);
  const isSearchEnabled = debouncedKeyword.length >= minKeywordLength;

  const {
    items = [],
    isFetching = false,
    isFetchingNextPage = false,
    isError = false,
    error = null,
    hasNextPage = false,
    fetchNextPage = () => undefined,
  } = useQuery(debouncedKeyword, isSearchEnabled);

  const filteredItems = useMemo<readonly T[]>(() => {
    if (!excludeNames || excludeNames.length === 0) return items;
    const excludeSet = new Set(excludeNames);
    return items.filter((item) => !excludeSet.has(getItemName(item)));
  }, [excludeNames, getItemName, items]);
  const autoLoadKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      !isSearchEnabled ||
      !hasNextPage ||
      isFetching ||
      isFetchingNextPage ||
      items.length === 0 ||
      filteredItems.length > 0
    ) {
      return;
    }

    const autoLoadKey = `${debouncedKeyword}:${items.length}:${excludeNames?.join("|") ?? ""}`;
    if (autoLoadKeyRef.current === autoLoadKey) {
      return;
    }

    autoLoadKeyRef.current = autoLoadKey;
    fetchNextPage();
  }, [
    debouncedKeyword,
    excludeNames,
    fetchNextPage,
    filteredItems.length,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isSearchEnabled,
    items.length,
  ]);

  return {
    items: filteredItems,
    isFetching,
    isFetchingNextPage,
    isError,
    error,
    hasNextPage,
    isSearchEnabled,
    loadMore: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  };
}

export function useDrugAllergySearch(options: BaseSearchOptions): UseDrugAllergySearchResult {
  return useFilteredInfiniteSearch<DrugAllergySearchItem>({
    ...options,
    minKeywordLength: MIN_ALLERGY_KEYWORD_LENGTH,
    getItemName: (item) => item.allergyName,
    useQuery: useSearchDrugAllergiesQuery,
  });
}

export function useDiseaseSearch(options: BaseSearchOptions): UseDiseaseSearchResult {
  return useFilteredInfiniteSearch<DiseaseSearchItem>({
    ...options,
    minKeywordLength: MIN_DISEASE_KEYWORD_LENGTH,
    getItemName: (item) => item.diseaseName,
    useQuery: useSearchDiseasesQuery,
  });
}
