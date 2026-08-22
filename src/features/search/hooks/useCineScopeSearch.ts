import { useInfiniteQuery } from '@tanstack/react-query'

import {
  getTmdbErrorMessage,
  tmdbFetch,
} from '../../../lib/tmdb/client'

import type {
  TmdbMultiSearchResponse,
} from '../../../types/tmdb'

import {
  buildSearchQuery,
  flattenSearchPages,
  getNextSearchPage,
  getSearchQueryKey,
  SEARCH_MINIMUM_LENGTH,
} from '../data/search'

export function useCineScopeSearch(
  query: string,
  enabled = true,
) {
  const isEnabled =
    enabled && query.length >= SEARCH_MINIMUM_LENGTH

  const searchQuery = useInfiniteQuery({
    queryKey: getSearchQueryKey(query),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      tmdbFetch<TmdbMultiSearchResponse>(
        '/search/multi',
        {
          query: buildSearchQuery(
            query,
            pageParam,
          ),
          signal,
        },
      ),
    enabled: isEnabled,
    getNextPageParam: getNextSearchPage,
  })

  const records = flattenSearchPages(
    searchQuery.data?.pages,
  )

  const firstPage = searchQuery.data?.pages[0]

  function retry(): void {
    void searchQuery.refetch()
  }

  function loadNextPage(): void {
    if (
      searchQuery.hasNextPage &&
      !searchQuery.isFetchingNextPage
    ) {
      void searchQuery.fetchNextPage()
    }
  }

  return {
    errorMessage: searchQuery.error
      ? getTmdbErrorMessage(searchQuery.error)
      : null,
    hasNextPage: Boolean(
      searchQuery.hasNextPage,
    ),
    isEnabled,
    isFetchingNextPage:
      searchQuery.isFetchingNextPage,
    isInitialError:
      searchQuery.isError &&
      records.length === 0,
    isNextPageError:
      searchQuery.isFetchNextPageError,
    isPending:
      isEnabled &&
      searchQuery.isPending,
    loadNextPage,
    loadedPageCount:
      searchQuery.data?.pages.length ?? 0,
    records,
    retry,
    totalResults:
      firstPage?.total_results ?? 0,
  }
}
