import { useInfiniteQuery } from '@tanstack/react-query'

import {
  getTmdbErrorMessage,
  tmdbFetch,
} from '../../../lib/tmdb/client'
import type {
  TmdbMovie,
  TmdbPaginatedResponse,
  TmdbTvShow,
} from '../../../types/tmdb'
import {
  buildIntentDiscoverQuery,
  flattenIntentPages,
  getIntentQueryKey,
  getNextIntentPage,
  supportsIntentMedia,
  type IntentSearchCriteria,
} from '../data/intentSearch'

export function useIntentSearch(
  criteria: IntentSearchCriteria,
  enabled = true,
) {
  const movieEnabled =
    enabled && supportsIntentMedia(criteria, 'movie')
  const tvEnabled =
    enabled && supportsIntentMedia(criteria, 'tv')

  const moviesQuery = useInfiniteQuery({
    queryKey: getIntentQueryKey(criteria, 'movie'),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      tmdbFetch<TmdbPaginatedResponse<TmdbMovie>>(
        '/discover/movie',
        {
          query: buildIntentDiscoverQuery(
            criteria,
            'movie',
            pageParam,
          ),
          signal,
        },
      ),
    enabled: movieEnabled,
    getNextPageParam: getNextIntentPage,
  })

  const tvQuery = useInfiniteQuery({
    queryKey: getIntentQueryKey(criteria, 'tv'),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      tmdbFetch<TmdbPaginatedResponse<TmdbTvShow>>(
        '/discover/tv',
        {
          query: buildIntentDiscoverQuery(
            criteria,
            'tv',
            pageParam,
          ),
          signal,
        },
      ),
    enabled: tvEnabled,
    getNextPageParam: getNextIntentPage,
  })

  const records = flattenIntentPages(
    moviesQuery.data?.pages,
    tvQuery.data?.pages,
    criteria,
  )
  const enabledQueries = [
    movieEnabled ? moviesQuery : null,
    tvEnabled ? tvQuery : null,
  ].filter(
    (query): query is typeof moviesQuery | typeof tvQuery =>
      query !== null,
  )
  const errors = enabledQueries
    .map((query) => query.error)
    .filter((error): error is Error => error instanceof Error)

  function retry(): void {
    if (movieEnabled) void moviesQuery.refetch()
    if (tvEnabled) void tvQuery.refetch()
  }

  function loadNextPage(): void {
    if (
      movieEnabled &&
      moviesQuery.hasNextPage &&
      !moviesQuery.isFetchingNextPage
    ) {
      void moviesQuery.fetchNextPage()
    }

    if (
      tvEnabled &&
      tvQuery.hasNextPage &&
      !tvQuery.isFetchingNextPage
    ) {
      void tvQuery.fetchNextPage()
    }
  }

  return {
    errorMessage: errors[0]
      ? getTmdbErrorMessage(errors[0])
      : null,
    hasNextPage: enabledQueries.some(
      (query) => query.hasNextPage,
    ),
    isEnabled: enabled && enabledQueries.length > 0,
    isFetchingNextPage: enabledQueries.some(
      (query) => query.isFetchingNextPage,
    ),
    isInitialError:
      enabledQueries.length > 0 &&
      enabledQueries.every((query) => query.isError) &&
      records.length === 0,
    isNextPageError: enabledQueries.some(
      (query) => query.isFetchNextPageError,
    ),
    isPending:
      enabledQueries.length > 0 &&
      enabledQueries.some((query) => query.isPending),
    loadNextPage,
    loadedPageCount: Math.max(
      moviesQuery.data?.pages.length ?? 0,
      tvQuery.data?.pages.length ?? 0,
    ),
    records,
    retry,
    totalResults:
      (moviesQuery.data?.pages[0]?.total_results ?? 0) +
      (tvQuery.data?.pages[0]?.total_results ?? 0),
  }
}
