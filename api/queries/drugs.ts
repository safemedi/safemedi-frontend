import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { DRUG_SEARCH_PAGE_SIZE, searchDrugs } from "@/api/endpoints/drugs";
import { queryKeys } from "@/api/query-keys";
import type { DrugSearchItem } from "@/api/types";

const STALE_MS = 60_000;

export interface SearchDrugsQueryResult {
  readonly items: readonly DrugSearchItem[];
  readonly isFetching: boolean;
  readonly isFetchingNextPage: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly hasNextPage: boolean;
  readonly fetchNextPage: () => void;
}

export function useSearchDrugsQuery(keyword: string, enabled: boolean): SearchDrugsQueryResult {
  const query = useInfiniteQuery({
    queryKey: queryKeys.scan.searchDrugs(keyword),
    queryFn: ({ pageParam }) =>
      searchDrugs({ keyword, page: pageParam, size: DRUG_SEARCH_PAGE_SIZE }),
    enabled,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.isLast ? undefined : lastPage.page + 1),
    staleTime: STALE_MS,
  });

  const items = useMemo<readonly DrugSearchItem[]>(
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
