import { useQuery } from '@tanstack/react-query'

import {
  getTmdbErrorMessage,
  TmdbApiError,
  tmdbFetch,
} from '../../../lib/tmdb/client'

import type {
  TmdbTvDetails,
  TmdbWatchProviderResponse,
} from '../../../types/tmdb'

import {
  getTvDetailQueryKey,
  getTvWatchProvidersQueryKey,
  TV_DETAIL_APPEND_TO_RESPONSE,
} from '../data/tvDetail'

function shouldRetryTvDetail(
  failureCount: number,
  error: Error,
): boolean {
  if (
    error instanceof TmdbApiError &&
    error.status === 404
  ) {
    return false
  }

  return failureCount < 2
}

export function useTvDetail(
  tvId: number | null,
) {
  const detailsQuery = useQuery({
    queryKey: getTvDetailQueryKey(tvId),
    queryFn: ({ signal }) => {
      if (tvId === null) {
        throw new Error(
          'A valid television identifier is required.',
        )
      }

      return tmdbFetch<TmdbTvDetails>(
        `/tv/${tvId}`,
        {
          query: {
            append_to_response:
              TV_DETAIL_APPEND_TO_RESPONSE,
            language: 'en-US',
          },
          signal,
        },
      )
    },
    enabled: tvId !== null,
    retry: shouldRetryTvDetail,
    staleTime: 5 * 60 * 1000,
  })

  const watchProvidersQuery = useQuery({
    queryKey:
      getTvWatchProvidersQueryKey(tvId),
    queryFn: ({ signal }) => {
      if (tvId === null) {
        throw new Error(
          'A valid television identifier is required.',
        )
      }

      return tmdbFetch<TmdbWatchProviderResponse>(
        `/tv/${tvId}/watch/providers`,
        {
          signal,
        },
      )
    },
    enabled:
      tvId !== null && detailsQuery.isSuccess,
    retry: 1,
    staleTime: 15 * 60 * 1000,
  })

  const isMissing =
    detailsQuery.error instanceof TmdbApiError &&
    detailsQuery.error.status === 404

  function retryDetails(): void {
    void detailsQuery.refetch()
  }

  function retryWatchProviders(): void {
    void watchProvidersQuery.refetch()
  }

  return {
    details: {
      data: detailsQuery.data ?? null,
      errorMessage:
        detailsQuery.error && !isMissing
          ? getTmdbErrorMessage(
              detailsQuery.error,
            )
          : null,
      isError:
        detailsQuery.isError && !isMissing,
      isMissing,
      isPending: detailsQuery.isPending,
      retry: retryDetails,
    },
    watchProviders: {
      data: watchProvidersQuery.data ?? null,
      errorMessage: watchProvidersQuery.error
        ? getTmdbErrorMessage(
            watchProvidersQuery.error,
          )
        : null,
      isError: watchProvidersQuery.isError,
      isPending:
        detailsQuery.isSuccess &&
        watchProvidersQuery.isPending,
      retry: retryWatchProviders,
    },
  }
}
