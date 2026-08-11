import type {
  TmdbMovie,
  TmdbPaginatedResponse,
  TmdbTvShow,
} from '../../../types/tmdb'

import {
  getLibraryRecordKey,
  type LibraryRecord,
} from '../../library/data/library'
import {
  createDefaultPreferences,
  getPreferenceGenreIds,
  type UserPreferences,
} from '../../preferences/data/preferences'
import {
  adaptMovie,
  adaptTv,
  getAvailableDiscoverPages,
  type DiscoverRecord,
} from './discoverExperience'

const MAX_ARCHIVE_SEEDS = 4
const MAX_ARCHIVE_RECOMMENDATIONS = 20

export type ArchiveRecommendationSeed = Pick<
  LibraryRecord,
  'id' | 'mediaType' | 'title'
>

export type ArchiveRecommendationResponse = {
  response: TmdbPaginatedResponse<
    TmdbMovie | TmdbTvShow
  >
  seed: ArchiveRecommendationSeed
}

type RankedArchiveRecommendation = {
  firstSeenOrder: number
  record: DiscoverRecord
  sourceCount: number
  weight: number
}

function getSeedStrength(
  record: LibraryRecord,
  preferences: UserPreferences,
): number {
  const ratingStrength = record.userRating
    ? record.userRating * 10
    : 0
  const mediaStrength =
    preferences.preferredMedia === record.mediaType
      ? 35
      : 0

  return (
    (record.isFavorite ? 200 : 0) +
    (record.userRating && record.userRating >= 7
      ? 100
      : 0) +
    (record.isWatched ? 50 : 0) +
    mediaStrength +
    ratingStrength
  )
}

export function selectArchiveRecommendationSeeds(
  records: LibraryRecord[],
  preferences = createDefaultPreferences(),
): ArchiveRecommendationSeed[] {
  const positiveSignals = records.filter(
    (record) =>
      record.isFavorite ||
      (record.userRating ?? 0) >= 7,
  )
  const unratedRecords = records.filter(
    (record) => record.userRating === null,
  )
  const candidates =
    positiveSignals.length > 0
      ? positiveSignals
      : unratedRecords

  return [...candidates]
    .sort((first, second) => {
      const strengthDifference =
        getSeedStrength(second, preferences) -
        getSeedStrength(first, preferences)

      if (strengthDifference !== 0) {
        return strengthDifference
      }

      return second.updatedAt.localeCompare(
        first.updatedAt,
      )
    })
    .slice(0, MAX_ARCHIVE_SEEDS)
    .map(({ id, mediaType, title }) => ({
      id,
      mediaType,
      title,
    }))
}

function getCandidateWeight(
  record: DiscoverRecord,
  resultIndex: number,
  preferences: UserPreferences,
): number {
  const score = record.score ?? 0
  const audienceWeight = Math.min(
    Math.log10(record.voteCount + 1),
    5,
  )
  const preferredGenreIds = getPreferenceGenreIds(
    preferences,
    record.mediaType,
  )
  const genreMatches = record.genreIds.filter((genreId) =>
    preferredGenreIds.has(genreId),
  ).length
  const mediaWeight =
    preferences.preferredMedia === record.mediaType
      ? 24
      : 0
  const languageWeight =
    preferences.preferredLanguage !== 'any' &&
    preferences.preferredLanguage ===
      record.originalLanguage
      ? 16
      : 0

  return (
    Math.max(0, 20 - resultIndex) * 3 +
    score * 2 +
    audienceWeight +
    mediaWeight +
    languageWeight +
    Math.min(genreMatches, 3) * 12
  )
}

export function buildArchiveRecommendations(
  responses: ArchiveRecommendationResponse[],
  libraryRecords: LibraryRecord[],
  preferences = createDefaultPreferences(),
): DiscoverRecord[] {
  const libraryKeys = new Set(
    libraryRecords.map((record) =>
      getLibraryRecordKey(
        record.mediaType,
        record.id,
      ),
    ),
  )
  const rankedRecords = new Map<
    string,
    RankedArchiveRecommendation
  >()
  let firstSeenOrder = 0

  responses.forEach(({ response, seed }) => {
    const sourceKeys = new Set<string>()

    response.results.forEach((result, resultIndex) => {
      if (result.adult) return

      const record =
        seed.mediaType === 'movie'
          ? adaptMovie(result as TmdbMovie)
          : adaptTv(result as TmdbTvShow)
      const recordKey = getLibraryRecordKey(
        record.mediaType,
        record.id,
      )

      if (
        libraryKeys.has(recordKey) ||
        sourceKeys.has(recordKey) ||
        (!record.posterPath && !record.backdropPath)
      ) {
        return
      }

      sourceKeys.add(recordKey)
      const existingRecord = rankedRecords.get(recordKey)

      if (existingRecord) {
        existingRecord.sourceCount += 1
        existingRecord.weight += getCandidateWeight(
          record,
          resultIndex,
          preferences,
        )
        return
      }

      rankedRecords.set(recordKey, {
        firstSeenOrder,
        record,
        sourceCount: 1,
        weight: getCandidateWeight(
          record,
          resultIndex,
          preferences,
        ),
      })
      firstSeenOrder += 1
    })
  })

  return [...rankedRecords.values()]
    .sort(
      (first, second) =>
        second.sourceCount - first.sourceCount ||
        second.weight - first.weight ||
        first.firstSeenOrder - second.firstSeenOrder,
    )
    .slice(0, MAX_ARCHIVE_RECOMMENDATIONS)
    .map(({ record }) => record)
}

export function getArchiveRecommendationPages(
  responses: ArchiveRecommendationResponse[],
): number {
  const totalPages = Math.max(
    1,
    ...responses.map(
      ({ response }) => response.total_pages,
    ),
  )

  return getAvailableDiscoverPages(totalPages)
}
