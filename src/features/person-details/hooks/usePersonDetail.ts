import { useQuery } from '@tanstack/react-query'

import {
  getTmdbErrorMessage,
  TmdbApiError,
  tmdbFetch,
} from '../../../lib/tmdb/client'

import type {
  TmdbPersonDetails,
} from '../../../types/tmdb'

import {
  getPersonDetailQueryKey,
  PERSON_DETAIL_APPEND_TO_RESPONSE,
} from '../data/personDetail'

function shouldRetryPerson(
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

export function usePersonDetail(
  personId: number | null,
) {
  const personQuery = useQuery({
    queryKey: getPersonDetailQueryKey(personId),
    queryFn: ({ signal }) => {
      if (personId === null) {
        throw new Error(
          'A valid contributor identifier is required.',
        )
      }

      return tmdbFetch<TmdbPersonDetails>(
        `/person/${personId}`,
        {
          query: {
            append_to_response:
              PERSON_DETAIL_APPEND_TO_RESPONSE,
            language: 'en-US',
          },
          signal,
        },
      )
    },
    enabled: personId !== null,
    retry: shouldRetryPerson,
    staleTime: 15 * 60 * 1000,
  })

  const isMissing =
    personQuery.error instanceof TmdbApiError &&
    personQuery.error.status === 404

  function retry(): void {
    void personQuery.refetch()
  }

  return {
    data: personQuery.data ?? null,
    errorMessage:
      personQuery.error && !isMissing
        ? getTmdbErrorMessage(personQuery.error)
        : null,
    isError: personQuery.isError && !isMissing,
    isMissing,
    isPending: personQuery.isPending,
    retry,
  }
}
