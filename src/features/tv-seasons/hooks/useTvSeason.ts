import { useQuery } from '@tanstack/react-query'

import {
  getTmdbErrorMessage,
  TmdbApiError,
  tmdbFetch,
} from '../../../lib/tmdb/client'

import type {
  TmdbTvDetails,
  TmdbTvSeasonDetails,
} from '../../../types/tmdb'

import {
  getTvDetailQueryKey,
  TV_DETAIL_APPEND_TO_RESPONSE,
} from '../../tv-details/data/tvDetail'
import {
  getTvSeasonQueryKey,
  TV_SEASON_APPEND_TO_RESPONSE,
} from '../data/tvSeason'

function shouldRetryRequest(
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

function isMissingError(
  error: Error | null,
): boolean {
  return (
    error instanceof TmdbApiError &&
    error.status === 404
  )
}

export function useTvSeason(
  tvId: number | null,
  seasonNumber: number | null,
) {
  const isEnabled =
    tvId !== null && seasonNumber !== null

  const seriesQuery = useQuery({
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
    enabled: isEnabled,
    retry: shouldRetryRequest,
    staleTime: 5 * 60 * 1000,
  })

  const seasonQuery = useQuery({
    queryKey: getTvSeasonQueryKey(
      tvId,
      seasonNumber,
    ),
    queryFn: ({ signal }) => {
      if (
        tvId === null ||
        seasonNumber === null
      ) {
        throw new Error(
          'A valid season record is required.',
        )
      }

      return tmdbFetch<TmdbTvSeasonDetails>(
        `/tv/${tvId}/season/${seasonNumber}`,
        {
          query: {
            append_to_response:
              TV_SEASON_APPEND_TO_RESPONSE,
            language: 'en-US',
          },
          signal,
        },
      )
    },
    enabled: isEnabled,
    retry: shouldRetryRequest,
    staleTime: 10 * 60 * 1000,
  })

  const errors = [
    seriesQuery.error,
    seasonQuery.error,
  ].filter(
    (error): error is Error => Boolean(error),
  )
  const isMissing = errors.some(isMissingError)
  const visibleError = errors.find(
    (error) => !isMissingError(error),
  )

  function retry(): void {
    void Promise.all([
      seriesQuery.refetch(),
      seasonQuery.refetch(),
    ])
  }

  return {
    errorMessage: visibleError
      ? getTmdbErrorMessage(visibleError)
      : null,
    isError:
      (seriesQuery.isError || seasonQuery.isError) &&
      !isMissing,
    isMissing,
    isPending:
      isEnabled &&
      (seriesQuery.isPending || seasonQuery.isPending),
    retry,
    season: seasonQuery.data ?? null,
    series: seriesQuery.data ?? null,
  }
}
