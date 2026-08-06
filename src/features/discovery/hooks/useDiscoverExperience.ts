import { useQuery } from '@tanstack/react-query'

import {
  getTmdbErrorMessage,
  tmdbFetch,
} from '../../../lib/tmdb/client'

import type {
  TmdbMovie,
  TmdbMultiSearchResult,
  TmdbPaginatedResponse,
  TmdbTvShow,
} from '../../../types/tmdb'

import {
  buildDiscoverQuery,
  getAvailableDiscoverPages,
  getDiscoverQueryKey,
  getDiscoverSignalDefinition,
  selectDiscoverRecords,
  type DiscoverSignalId,
} from '../data/discoverExperience'

type DiscoverApiRecord =
  | TmdbMovie
  | TmdbTvShow
  | TmdbMultiSearchResult

export function useDiscoverExperience(
  signal: DiscoverSignalId,
  page: number,
) {
  const definition =
    getDiscoverSignalDefinition(signal)

  const query = useQuery({
    queryKey: getDiscoverQueryKey(signal, page),
    queryFn: ({ signal: requestSignal }) =>
      tmdbFetch<
        TmdbPaginatedResponse<DiscoverApiRecord>
      >(definition.endpoint, {
        query: buildDiscoverQuery(
          definition,
          page,
        ),
        signal: requestSignal,
      }),
  })

  const records = query.data
    ? selectDiscoverRecords(query.data, definition)
    : []

  function retry(): void {
    void query.refetch()
  }

  return {
    availablePages: getAvailableDiscoverPages(
      query.data?.total_pages ?? 1,
    ),
    definition,
    errorMessage: query.error
      ? getTmdbErrorMessage(query.error)
      : null,
    isEmpty:
      query.isSuccess && records.length === 0,
    isError: query.isError,
    isPending: query.isPending,
    records,
    retry,
    totalResults:
      query.data?.total_results ?? 0,
  }
}
