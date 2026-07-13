import { useQuery } from '@tanstack/react-query'

import {
  getTmdbErrorMessage,
  TmdbApiError,
  tmdbFetch,
} from '../../../lib/tmdb/client'

import type {
  TmdbMovieDetails,
  TmdbWatchProviderResponse,
} from '../../../types/tmdb'

import {
  getMovieDetailQueryKey,
  getMovieWatchProvidersQueryKey,
  MOVIE_DETAIL_APPEND_TO_RESPONSE,
} from '../data/movieDetail'

function shouldRetryMovieDetail(
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

export function useMovieDetail(
  movieId: number | null,
) {
  const detailsQuery = useQuery({
    queryKey: getMovieDetailQueryKey(movieId),

    queryFn: ({ signal }) => {
      if (movieId === null) {
        throw new Error(
          'A valid movie identifier is required.',
        )
      }

      return tmdbFetch<TmdbMovieDetails>(
        `/movie/${movieId}`,
        {
          query: {
            append_to_response:
              MOVIE_DETAIL_APPEND_TO_RESPONSE,
            language: 'en-US',
          },
          signal,
        },
      )
    },

    enabled: movieId !== null,
    retry: shouldRetryMovieDetail,
    staleTime: 5 * 60 * 1000,
  })

  const watchProvidersQuery = useQuery({
    queryKey:
      getMovieWatchProvidersQueryKey(movieId),

    queryFn: ({ signal }) => {
      if (movieId === null) {
        throw new Error(
          'A valid movie identifier is required.',
        )
      }

      return tmdbFetch<TmdbWatchProviderResponse>(
        `/movie/${movieId}/watch/providers`,
        {
          signal,
        },
      )
    },

    enabled:
      movieId !== null &&
      detailsQuery.isSuccess,

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
        detailsQuery.isError &&
        !isMissing,

      isMissing,
      isPending: detailsQuery.isPending,
      retry: retryDetails,
    },

    watchProviders: {
      data:
        watchProvidersQuery.data ?? null,

      errorMessage:
        watchProvidersQuery.error
          ? getTmdbErrorMessage(
              watchProvidersQuery.error,
            )
          : null,

      isError:
        watchProvidersQuery.isError,

      isPending:
        detailsQuery.isSuccess &&
        watchProvidersQuery.isPending,

      retry: retryWatchProviders,
    },
  }
}