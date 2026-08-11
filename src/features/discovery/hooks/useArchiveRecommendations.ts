import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'

import {
  getTmdbErrorMessage,
  tmdbFetch,
} from '../../../lib/tmdb/client'
import type {
  TmdbMovie,
  TmdbPaginatedResponse,
  TmdbTvShow,
} from '../../../types/tmdb'

import { useLibrary } from '../../library/hooks/useLibrary'
import {
  getPreferenceSummary,
} from '../../preferences/data/preferences'
import { usePreferences } from '../../preferences/hooks/usePreferences'
import type { RecommendationMoodId } from '../../recommendations/data/recommendationMoods'
import { useRecommendationFeedback } from '../../recommendations/hooks/useRecommendationFeedback'
import {
  buildArchiveRecommendations,
  getArchiveRecommendationPages,
  selectArchiveRecommendationSeeds,
  type ArchiveRecommendationResponse,
} from '../data/archiveRecommendations'

export function useArchiveRecommendations(
  enabled: boolean,
  page: number,
  mood: RecommendationMoodId,
) {
  const { records: libraryRecords } = useLibrary()
  const { preferences } = usePreferences()
  const { feedback } = useRecommendationFeedback()
  const seeds = useMemo(
    () =>
      selectArchiveRecommendationSeeds(
        libraryRecords,
        preferences,
      ),
    [libraryRecords, preferences],
  )
  const queries = useQueries({
    queries: seeds.map((seed) => ({
      enabled,
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        tmdbFetch<
          TmdbPaginatedResponse<
            TmdbMovie | TmdbTvShow
          >
        >(
          `/${seed.mediaType}/${seed.id}/recommendations`,
          {
            query: {
              language: 'en-US',
              page,
            },
            signal,
          },
        ),
      queryKey: [
        'tmdb',
        'archive-recommendations',
        seed.mediaType,
        seed.id,
        page,
        'en-US',
      ] as const,
    })),
  })
  const responses = queries.flatMap(
    (query, index): ArchiveRecommendationResponse[] => {
      const seed = seeds[index]

      return query.data && seed
        ? [{ response: query.data, seed }]
        : []
    },
  )
  const records = buildArchiveRecommendations(
    responses,
    libraryRecords,
    preferences,
    {
      mood,
      notInterestedRecordKeys:
        feedback.notInterestedRecordKeys,
    },
  )
  const isPending =
    enabled &&
    seeds.length > 0 &&
    queries.some((query) => query.isPending)
  const isError =
    enabled &&
    seeds.length > 0 &&
    queries.length > 0 &&
    queries.every((query) => query.isError)
  const firstError = queries.find(
    (query) => query.error,
  )?.error

  function retry(): void {
    queries.forEach((query) => {
      void query.refetch()
    })
  }

  return {
    availablePages:
      getArchiveRecommendationPages(responses),
    errorMessage: firstError
      ? getTmdbErrorMessage(firstError)
      : null,
    hasSeeds: seeds.length > 0,
    isEmpty:
      enabled &&
      (seeds.length === 0 ||
        (!isPending && !isError && records.length === 0)),
    isError,
    isPending,
    preferenceSummary:
      getPreferenceSummary(preferences),
    records,
    retry,
    seedTitles: seeds.map((seed) => seed.title),
    totalResults: records.length,
  }
}
