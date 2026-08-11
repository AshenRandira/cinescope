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
  preferenceGenreDefinitions,
  preferredLanguageOptions,
  type UserPreferences,
} from '../../preferences/data/preferences'
import {
  defaultRecommendationMood,
  getRecommendationMoodDefinition,
  getRecommendationMoodMatchCount,
  type RecommendationMoodId,
} from '../../recommendations/data/recommendationMoods'
import {
  adaptMovie,
  adaptTv,
  getAvailableDiscoverPages,
  type DiscoverRecord,
} from './discoverExperience'

const MAX_ARCHIVE_SEEDS = 4
const MAX_ARCHIVE_RECOMMENDATIONS = 20

export type ArchiveRecommendationSeedSignal =
  | 'favorite'
  | 'high-rating'
  | 'progress'
  | 'recent'

export type ArchiveRecommendationSeed = Pick<
  LibraryRecord,
  'id' | 'mediaType' | 'title'
> & {
  signal: ArchiveRecommendationSeedSignal
}

export type ArchiveRecommendationResponse = {
  response: TmdbPaginatedResponse<
    TmdbMovie | TmdbTvShow
  >
  seed: ArchiveRecommendationSeed
}

type RankedArchiveRecommendation = {
  firstSeenOrder: number
  record: DiscoverRecord
  sourceSeeds: ArchiveRecommendationSeed[]
  sourceCount: number
  weight: number
}

export type ArchiveRecommendationOptions = {
  mood?: RecommendationMoodId
  notInterestedRecordKeys?: Iterable<string>
}

function hasActiveTvProgress(
  record: LibraryRecord,
): boolean {
  return (
    record.mediaType === 'tv' &&
    !record.isWatched &&
    record.tvProgress !== null &&
    record.tvProgress.watchedEpisodeKeys.length > 0
  )
}

function getSeedSignal(
  record: LibraryRecord,
): ArchiveRecommendationSeedSignal {
  if (record.isFavorite) return 'favorite'
  if ((record.userRating ?? 0) >= 7) {
    return 'high-rating'
  }
  if (hasActiveTvProgress(record)) return 'progress'

  return 'recent'
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
  const progressStrength = hasActiveTvProgress(record)
    ? 140
    : 0

  return (
    (record.isFavorite ? 200 : 0) +
    (record.userRating && record.userRating >= 7
      ? 100
      : 0) +
    (record.isWatched ? 50 : 0) +
    progressStrength +
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
      (record.userRating ?? 0) >= 7 ||
      hasActiveTvProgress(record),
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
    .map((record) => ({
      id: record.id,
      mediaType: record.mediaType,
      signal: getSeedSignal(record),
      title: record.title,
    }))
}

function getCandidateWeight(
  record: DiscoverRecord,
  resultIndex: number,
  preferences: UserPreferences,
  mood: RecommendationMoodId,
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
  const moodWeight =
    Math.min(
      getRecommendationMoodMatchCount(record, mood),
      2,
    ) * 18

  return (
    Math.max(0, 20 - resultIndex) * 3 +
    score * 2 +
    audienceWeight +
    mediaWeight +
    languageWeight +
    moodWeight +
    Math.min(genreMatches, 3) * 12
  )
}

function getSourceReason(
  sourceSeeds: ArchiveRecommendationSeed[],
): string {
  if (sourceSeeds.length > 1) {
    return `Connected to ${sourceSeeds.length} archive anchors, including ${sourceSeeds[0]!.title}.`
  }

  const seed = sourceSeeds[0]

  if (!seed) {
    return 'Connected to the strongest signals in your archive.'
  }

  switch (seed.signal) {
    case 'favorite':
      return `Because ${seed.title} is one of your favourites.`
    case 'high-rating':
      return `Because you rated ${seed.title} highly.`
    case 'progress':
      return `Because you are continuing ${seed.title}.`
    case 'recent':
      return `Connected to your recent save of ${seed.title}.`
  }
}

function getPersonalizationReason(
  record: DiscoverRecord,
  preferences: UserPreferences,
  mood: RecommendationMoodId,
): string | null {
  if (
    mood !== defaultRecommendationMood &&
    getRecommendationMoodMatchCount(record, mood) > 0
  ) {
    const moodDefinition =
      getRecommendationMoodDefinition(mood)

    return `Fits this ${moodDefinition.label.toLowerCase()} mood.`
  }

  const matchingGenre = preferences.favoriteGenres.find(
    (genreId) => {
      const definition = preferenceGenreDefinitions.find(
        ({ id }) => id === genreId,
      )
      const genreIds =
        record.mediaType === 'movie'
          ? definition?.movieGenreIds
          : definition?.tvGenreIds

      return genreIds?.some((genreId) =>
        record.genreIds.includes(genreId),
      )
    },
  )

  if (matchingGenre) {
    const label = preferenceGenreDefinitions.find(
      ({ id }) => id === matchingGenre,
    )?.label

    if (label) {
      return `Matches your ${label.toLowerCase()} preference.`
    }
  }

  if (preferences.preferredMedia === record.mediaType) {
    return record.mediaType === 'movie'
      ? 'Leans toward your preferred film records.'
      : 'Leans toward your preferred series records.'
  }

  if (
    preferences.preferredLanguage !== 'any' &&
    preferences.preferredLanguage === record.originalLanguage
  ) {
    const language = preferredLanguageOptions.find(
      ({ value }) =>
        value === preferences.preferredLanguage,
    )?.label

    if (language) {
      return `Matches your ${language} language preference.`
    }
  }

  return null
}

export function buildArchiveRecommendations(
  responses: ArchiveRecommendationResponse[],
  libraryRecords: LibraryRecord[],
  preferences = createDefaultPreferences(),
  options: ArchiveRecommendationOptions = {},
): DiscoverRecord[] {
  const mood = options.mood ?? defaultRecommendationMood
  const libraryKeys = new Set(
    libraryRecords.map((record) =>
      getLibraryRecordKey(
        record.mediaType,
        record.id,
      ),
    ),
  )
  const notInterestedRecordKeys = new Set(
    options.notInterestedRecordKeys ?? [],
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
        notInterestedRecordKeys.has(recordKey) ||
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
          mood,
        )
        existingRecord.sourceSeeds.push(seed)
        return
      }

      rankedRecords.set(recordKey, {
        firstSeenOrder,
        record,
        sourceSeeds: [seed],
        sourceCount: 1,
        weight: getCandidateWeight(
          record,
          resultIndex,
          preferences,
          mood,
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
    .map(({ record, sourceSeeds }) => {
      const personalizationReason =
        getPersonalizationReason(
          record,
          preferences,
          mood,
        )

      return {
        ...record,
        recommendationReasons: [
          getSourceReason(sourceSeeds),
          ...(personalizationReason
            ? [personalizationReason]
            : []),
        ],
      }
    })
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
