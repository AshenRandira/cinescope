import type { DiscoverRecord } from '../../discovery/data/discoverExperience'

export type RecommendationMoodId =
  | 'open'
  | 'comfort'
  | 'reflective'
  | 'tense'
  | 'transporting'

export type RecommendationMoodDefinition = {
  description: string
  label: string
  movieGenreIds: number[]
  tvGenreIds: number[]
  value: RecommendationMoodId
}

export const defaultRecommendationMood: RecommendationMoodId =
  'open'

export const recommendationMoodDefinitions: ReadonlyArray<RecommendationMoodDefinition> =
  [
    {
      description:
        'Keep the full archive ranking without an additional mood signal.',
      label: 'Open to anything',
      movieGenreIds: [],
      tvGenreIds: [],
      value: 'open',
    },
    {
      description:
        'Bring comedy, family, romance, and animation closer to the front.',
      label: 'Comforting',
      movieGenreIds: [16, 35, 10749, 10751],
      tvGenreIds: [16, 35, 10751, 10762],
      value: 'comfort',
    },
    {
      description:
        'Lean toward drama, documentary, history, and mystery.',
      label: 'Reflective',
      movieGenreIds: [18, 36, 99, 9648],
      tvGenreIds: [18, 99, 9648],
      value: 'reflective',
    },
    {
      description:
        'Raise crime, horror, mystery, thriller, and political pressure.',
      label: 'High tension',
      movieGenreIds: [27, 53, 80, 9648],
      tvGenreIds: [80, 9648, 10768],
      value: 'tense',
    },
    {
      description:
        'Move adventure, animation, fantasy, and speculative worlds forward.',
      label: 'Transporting',
      movieGenreIds: [12, 14, 16, 878],
      tvGenreIds: [16, 10759, 10765],
      value: 'transporting',
    },
  ]

export function parseRecommendationMood(
  value: string | null,
): RecommendationMoodId {
  return (
    recommendationMoodDefinitions.find(
      (definition) => definition.value === value,
    )?.value ?? defaultRecommendationMood
  )
}

export function getRecommendationMoodDefinition(
  mood: RecommendationMoodId,
): RecommendationMoodDefinition {
  return (
    recommendationMoodDefinitions.find(
      (definition) => definition.value === mood,
    ) ?? recommendationMoodDefinitions[0]
  )
}

export function getRecommendationMoodMatchCount(
  record: DiscoverRecord,
  mood: RecommendationMoodId,
): number {
  const definition = getRecommendationMoodDefinition(mood)
  const genreIds = new Set(
    record.mediaType === 'movie'
      ? definition.movieGenreIds
      : definition.tvGenreIds,
  )

  return record.genreIds.filter((genreId) =>
    genreIds.has(genreId),
  ).length
}
