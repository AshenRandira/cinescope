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
import { useArchiveRecommendations } from './useArchiveRecommendations'

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
  const isArchiveSignal = signal === 'archive'
  const archiveRecommendations =
    useArchiveRecommendations(isArchiveSignal, page)

  const query = useQuery({
    enabled: !isArchiveSignal,
    queryKey: getDiscoverQueryKey(signal, page),
    queryFn: ({ signal: requestSignal }) => {
      if (!definition.endpoint) {
        throw new Error(
          'This discovery signal does not use a catalogue endpoint.',
        )
      }

      return tmdbFetch<
        TmdbPaginatedResponse<DiscoverApiRecord>
      >(definition.endpoint, {
        query: buildDiscoverQuery(
          definition,
          page,
        ),
        signal: requestSignal,
      })
    },
  })

  const records = query.data
    ? selectDiscoverRecords(query.data, definition)
    : []

  function retry(): void {
    void query.refetch()
  }

  if (isArchiveSignal) {
    return {
      ...archiveRecommendations,
      definition,
    }
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
    seedTitles: [] as string[],
    hasSeeds: false,
    totalResults:
      query.data?.total_results ?? 0,
  }
}
