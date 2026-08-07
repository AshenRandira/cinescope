import { useQuery } from '@tanstack/react-query'

import {
  getTmdbErrorMessage,
  TmdbApiError,
  tmdbFetch,
} from '../../../lib/tmdb/client'

import type {
  TmdbTvEpisodeDetails,
} from '../../../types/tmdb'

import { useTvSeason } from '../../tv-seasons/hooks/useTvSeason'
import {
  getTvEpisodeQueryKey,
  TV_EPISODE_APPEND_TO_RESPONSE,
} from '../data/tvEpisode'

function shouldRetryEpisode(
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

export function useTvEpisode(
  tvId: number | null,
  seasonNumber: number | null,
  episodeNumber: number | null,
) {
  const seasonRecord = useTvSeason(
    tvId,
    seasonNumber,
  )
  const isEnabled =
    tvId !== null &&
    seasonNumber !== null &&
    episodeNumber !== null

  const episodeQuery = useQuery({
    queryKey: getTvEpisodeQueryKey(
      tvId,
      seasonNumber,
      episodeNumber,
    ),
    queryFn: ({ signal }) => {
      if (
        tvId === null ||
        seasonNumber === null ||
        episodeNumber === null
      ) {
        throw new Error(
          'A valid episode record is required.',
        )
      }

      return tmdbFetch<TmdbTvEpisodeDetails>(
        `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`,
        {
          query: {
            append_to_response:
              TV_EPISODE_APPEND_TO_RESPONSE,
            language: 'en-US',
          },
          signal,
        },
      )
    },
    enabled: isEnabled,
    retry: shouldRetryEpisode,
    staleTime: 10 * 60 * 1000,
  })

  const episodeIsMissing =
    episodeQuery.error instanceof TmdbApiError &&
    episodeQuery.error.status === 404
  const episodeErrorMessage =
    episodeQuery.error && !episodeIsMissing
      ? getTmdbErrorMessage(episodeQuery.error)
      : null

  function retry(): void {
    seasonRecord.retry()
    void episodeQuery.refetch()
  }

  return {
    episode: episodeQuery.data ?? null,
    errorMessage:
      seasonRecord.errorMessage ??
      episodeErrorMessage,
    isError:
      seasonRecord.isError ||
      (episodeQuery.isError && !episodeIsMissing),
    isMissing:
      seasonRecord.isMissing || episodeIsMissing,
    isPending:
      isEnabled &&
      (seasonRecord.isPending ||
        episodeQuery.isPending),
    retry,
    season: seasonRecord.season,
    series: seasonRecord.series,
  }
}
