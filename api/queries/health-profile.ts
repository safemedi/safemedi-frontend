import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  HEALTH_PROFILE_SEARCH_PAGE_SIZE,
  searchDiseases,
  searchDrugAllergies,
} from "@/api/endpoints/health-profile";
import { queryKeys } from "@/api/query-keys";
import type { DiseaseSearchItem, DrugAllergySearchItem } from "@/api/types";

const STALE_MS = 60_000;

export interface SearchDrugAllergiesQueryResult {
  readonly items: readonly DrugAllergySearchItem[];
  readonly isFetching: boolean;
  readonly isFetchingNextPage: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly hasNextPage: boolean;
  readonly fetchNextPage: () => void;
}

export interface SearchDiseasesQueryResult {
  readonly items: readonly DiseaseSearchItem[];
  readonly isFetching: boolean;
  readonly isFetchingNextPage: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly hasNextPage: boolean;
  readonly fetchNextPage: () => void;
}

export function useSearchDrugAllergiesQuery(
  keyword: string,
  enabled: boolean,
): SearchDrugAllergiesQueryResult {
  const query = useInfiniteQuery({
    queryKey: queryKeys.profile.searchDrugAllergies(keyword),
    queryFn: ({ pageParam }) =>
      searchDrugAllergies({ keyword, page: pageParam, size: HEALTH_PROFILE_SEARCH_PAGE_SIZE }),
    enabled,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.isLast ? undefined : lastPage.page + 1),
    staleTime: STALE_MS,
  });

  const items = useMemo<readonly DrugAllergySearchItem[]>(
    () => query.data?.pages.flatMap((page) => page.content) ?? [],
    [query.data],
  );

  return {
    items,
    isFetching: query.isFetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    fetchNextPage: () => {
      void query.fetchNextPage();
    },
  };
}

export function useSearchDiseasesQuery(
  keyword: string,
  enabled: boolean,
): SearchDiseasesQueryResult {
  const query = useInfiniteQuery({
    queryKey: queryKeys.profile.searchDiseases(keyword),
    queryFn: ({ pageParam }) =>
      searchDiseases({ keyword, page: pageParam, size: HEALTH_PROFILE_SEARCH_PAGE_SIZE }),
    enabled,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.isLast ? undefined : lastPage.page + 1),
    staleTime: STALE_MS,
  });

  const items = useMemo<readonly DiseaseSearchItem[]>(
    () => query.data?.pages.flatMap((page) => page.content) ?? [],
    [query.data],
  );

  return {
    items,
    isFetching: query.isFetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    fetchNextPage: () => {
      void query.fetchNextPage();
    },
  };
}
