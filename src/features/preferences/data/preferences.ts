export const PREFERENCE_GENRE_LIMIT = 5
export const PREFERENCES_STORAGE_KEY =
  'cinescope.preferences.v1'

export type PreferredMedia = 'balanced' | 'movie' | 'tv'

export type PreferredLanguage =
  | 'any'
  | 'de'
  | 'en'
  | 'es'
  | 'fr'
  | 'hi'
  | 'it'
  | 'ja'
  | 'ko'
  | 'ml'
  | 'pt'
  | 'si'
  | 'ta'
  | 'te'
  | 'zh'

export type PreferenceGenreId =
  | 'action'
  | 'animation'
  | 'comedy'
  | 'crime'
  | 'documentary'
  | 'drama'
  | 'family'
  | 'fantasy'
  | 'history'
  | 'horror'
  | 'music'
  | 'mystery'
  | 'romance'
  | 'science-fiction'
  | 'thriller'
  | 'war'
  | 'western'

export type UserPreferences = {
  favoriteGenres: PreferenceGenreId[]
  preferredLanguage: PreferredLanguage
  preferredMedia: PreferredMedia
  updatedAt: string | null
}

export type UserPreferenceInput = Pick<
  UserPreferences,
  'favoriteGenres' | 'preferredLanguage' | 'preferredMedia'
>

export type PreferenceGenreDefinition = {
  id: PreferenceGenreId
  label: string
  movieGenreIds: number[]
  tvGenreIds: number[]
}

export const preferenceGenreDefinitions: ReadonlyArray<PreferenceGenreDefinition> =
  [
    {
      id: 'action',
      label: 'Action',
      movieGenreIds: [28],
      tvGenreIds: [10759],
    },
    {
      id: 'animation',
      label: 'Animation',
      movieGenreIds: [16],
      tvGenreIds: [16],
    },
    {
      id: 'comedy',
      label: 'Comedy',
      movieGenreIds: [35],
      tvGenreIds: [35],
    },
    {
      id: 'crime',
      label: 'Crime',
      movieGenreIds: [80],
      tvGenreIds: [80],
    },
    {
      id: 'documentary',
      label: 'Documentary',
      movieGenreIds: [99],
      tvGenreIds: [99],
    },
    {
      id: 'drama',
      label: 'Drama',
      movieGenreIds: [18],
      tvGenreIds: [18],
    },
    {
      id: 'family',
      label: 'Family',
      movieGenreIds: [10751],
      tvGenreIds: [10751, 10762],
    },
    {
      id: 'fantasy',
      label: 'Fantasy',
      movieGenreIds: [14],
      tvGenreIds: [10765],
    },
    {
      id: 'history',
      label: 'History',
      movieGenreIds: [36],
      tvGenreIds: [],
    },
    {
      id: 'horror',
      label: 'Horror',
      movieGenreIds: [27],
      tvGenreIds: [],
    },
    {
      id: 'music',
      label: 'Music',
      movieGenreIds: [10402],
      tvGenreIds: [],
    },
    {
      id: 'mystery',
      label: 'Mystery',
      movieGenreIds: [9648],
      tvGenreIds: [9648],
    },
    {
      id: 'romance',
      label: 'Romance',
      movieGenreIds: [10749],
      tvGenreIds: [],
    },
    {
      id: 'science-fiction',
      label: 'Science fiction',
      movieGenreIds: [878],
      tvGenreIds: [10765],
    },
    {
      id: 'thriller',
      label: 'Thriller',
      movieGenreIds: [53],
      tvGenreIds: [],
    },
    {
      id: 'war',
      label: 'War and politics',
      movieGenreIds: [10752],
      tvGenreIds: [10768],
    },
    {
      id: 'western',
      label: 'Western',
      movieGenreIds: [37],
      tvGenreIds: [37],
    },
  ]

export const preferredLanguageOptions: ReadonlyArray<{
  label: string
  value: PreferredLanguage
}> = [
  { label: 'Any original language', value: 'any' },
  { label: 'English', value: 'en' },
  { label: 'Sinhala', value: 'si' },
  { label: 'Tamil', value: 'ta' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Malayalam', value: 'ml' },
  { label: 'Telugu', value: 'te' },
  { label: 'Korean', value: 'ko' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Italian', value: 'it' },
  { label: 'Portuguese', value: 'pt' },
]

const genreIds = new Set(
  preferenceGenreDefinitions.map(({ id }) => id),
)
const languageIds = new Set(
  preferredLanguageOptions.map(({ value }) => value),
)
const mediaIds = new Set<PreferredMedia>([
  'balanced',
  'movie',
  'tv',
])

function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

export function createDefaultPreferences(): UserPreferences {
  return {
    favoriteGenres: [],
    preferredLanguage: 'any',
    preferredMedia: 'balanced',
    updatedAt: null,
  }
}

export function getPreferencesStorageKey(
  userId: string,
): string {
  return `${PREFERENCES_STORAGE_KEY}.user.${encodeURIComponent(
    userId,
  )}`
}

export function parseUserPreferences(
  value: unknown,
): UserPreferences | null {
  if (!isObject(value)) return null

  const keys = Object.keys(value).sort()

  if (
    keys.join('|') !==
    'favoriteGenres|preferredLanguage|preferredMedia|updatedAt'
  ) {
    return null
  }

  if (
    !Array.isArray(value.favoriteGenres) ||
    value.favoriteGenres.length > PREFERENCE_GENRE_LIMIT ||
    value.favoriteGenres.some(
      (genre) =>
        typeof genre !== 'string' ||
        !genreIds.has(genre as PreferenceGenreId),
    ) ||
    new Set(value.favoriteGenres).size !==
      value.favoriteGenres.length ||
    typeof value.preferredLanguage !== 'string' ||
    !languageIds.has(
      value.preferredLanguage as PreferredLanguage,
    ) ||
    typeof value.preferredMedia !== 'string' ||
    !mediaIds.has(value.preferredMedia as PreferredMedia) ||
    typeof value.updatedAt !== 'string' ||
    !value.updatedAt
  ) {
    return null
  }

  return {
    favoriteGenres: [
      ...(value.favoriteGenres as PreferenceGenreId[]),
    ],
    preferredLanguage:
      value.preferredLanguage as PreferredLanguage,
    preferredMedia: value.preferredMedia as PreferredMedia,
    updatedAt: value.updatedAt,
  }
}

export function normalizePreferenceInput(
  value: UserPreferenceInput,
): UserPreferenceInput {
  return {
    favoriteGenres: [
      ...new Set(
        value.favoriteGenres.filter((genre) =>
          genreIds.has(genre),
        ),
      ),
    ].slice(0, PREFERENCE_GENRE_LIMIT),
    preferredLanguage: languageIds.has(
      value.preferredLanguage,
    )
      ? value.preferredLanguage
      : 'any',
    preferredMedia: mediaIds.has(value.preferredMedia)
      ? value.preferredMedia
      : 'balanced',
  }
}

export function getPreferenceGenreIds(
  preferences: UserPreferences,
  mediaType: 'movie' | 'tv',
): Set<number> {
  return new Set(
    preferences.favoriteGenres.flatMap((genreId) => {
      const definition = preferenceGenreDefinitions.find(
        ({ id }) => id === genreId,
      )

      if (!definition) return []

      return mediaType === 'movie'
        ? definition.movieGenreIds
        : definition.tvGenreIds
    }),
  )
}

export function getPreferenceSummary(
  preferences: UserPreferences,
): string {
  const parts: string[] = []

  if (preferences.preferredMedia === 'movie') {
    parts.push('Film leaning')
  } else if (preferences.preferredMedia === 'tv') {
    parts.push('Series leaning')
  }

  if (preferences.preferredLanguage !== 'any') {
    const language = preferredLanguageOptions.find(
      ({ value }) =>
        value === preferences.preferredLanguage,
    )

    if (language) parts.push(language.label)
  }

  const genreLabels = preferences.favoriteGenres
    .map(
      (genreId) =>
        preferenceGenreDefinitions.find(
          ({ id }) => id === genreId,
        )?.label,
    )
    .filter((label): label is string => Boolean(label))

  if (genreLabels.length > 0) {
    parts.push(genreLabels.join(', '))
  }

  return parts.length > 0
    ? parts.join(' / ')
    : 'Balanced catalogue signals'
}
