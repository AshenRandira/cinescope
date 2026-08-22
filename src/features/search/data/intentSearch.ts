import {
  preferenceGenreDefinitions,
  preferredLanguageOptions,
  type PreferenceGenreId,
  type PreferredLanguage,
} from '../../preferences/data/preferences'
import {
  defaultRecommendationMood,
  getRecommendationMoodDefinition,
  recommendationMoodDefinitions,
  type RecommendationMoodId,
} from '../../recommendations/data/recommendationMoods'
import type {
  TmdbMovie,
  TmdbPaginatedResponse,
  TmdbTvShow,
} from '../../../types/tmdb'
import type { SearchRecord } from './search'

export type IntentMedia = 'both' | 'movie' | 'tv'

export type IntentSearchCriteria = {
  decade: number | null
  familyFriendly: boolean
  genres: PreferenceGenreId[]
  language: PreferredLanguage
  media: IntentMedia
  mood: RecommendationMoodId
  runtimeMaximum: number | null
}

export type ParsedSearchIntent = {
  criteria: IntentSearchCriteria
  isIntent: boolean
  recognizedSignals: string[]
}

type IntentQuery = Record<
  string,
  boolean | number | string
>

const CURRENT_DECADE =
  Math.floor(new Date().getFullYear() / 10) * 10
const INTENT_RUNTIME_MAXIMUM = 360
const INTENT_GENRE_LIMIT = 4
const TMDB_PAGE_LIMIT = 500

export const intentMediaOptions: ReadonlyArray<{
  label: string
  value: IntentMedia
}> = [
  { label: 'Movies and series', value: 'both' },
  { label: 'Movies', value: 'movie' },
  { label: 'TV series', value: 'tv' },
]

const requestPattern =
  /\b(?:i\s+(?:want|need|feel like)|looking for|recommend|suggest|show me|(?:something|anything)(?:\s+\w+){0,3}\s+to watch|in the mood|what should i watch|watch tonight|find me)\b/i

const genrePatterns: ReadonlyArray<{
  id: PreferenceGenreId
  pattern: RegExp
}> = [
  { id: 'science-fiction', pattern: /\b(?:sci[ -]?fi|science fiction|speculative)\b/i },
  { id: 'documentary', pattern: /\b(?:documentary|documentaries|nonfiction|non-fiction)\b/i },
  { id: 'animation', pattern: /\b(?:animated|animation|anime)\b/i },
  { id: 'comedy', pattern: /\b(?:comedy|comedies|comic|funny|hilarious|laugh)\b/i },
  { id: 'family', pattern: /\b(?:family|kids?|children)\b/i },
  { id: 'thriller', pattern: /\b(?:thriller|thrilling|suspense|suspenseful)\b/i },
  { id: 'horror', pattern: /\b(?:horror|scary|frightening|creepy)\b/i },
  { id: 'romance', pattern: /\b(?:romance|romantic|love story)\b/i },
  { id: 'mystery', pattern: /\b(?:mystery|mysteries|whodunnit|detective)\b/i },
  { id: 'fantasy', pattern: /\b(?:fantasy|magical|magic)\b/i },
  { id: 'action', pattern: /\b(?:action|explosive|fight scenes?)\b/i },
  { id: 'crime', pattern: /\b(?:crime|gangster|heist)\b/i },
  { id: 'drama', pattern: /\b(?:drama|dramatic)\b/i },
  { id: 'history', pattern: /\b(?:history|historical|period piece)\b/i },
  { id: 'music', pattern: /\b(?:music|musical|concert)\b/i },
  { id: 'war', pattern: /\b(?:war|military|political)\b/i },
  { id: 'western', pattern: /\b(?:western|cowboy)\b/i },
]

const moodPatterns: ReadonlyArray<{
  pattern: RegExp
  value: RecommendationMoodId
}> = [
  {
    pattern:
      /\b(?:comforting|comfort|cozy|cosy|feel[ -]?good|heartwarming|relaxing|lighthearted)\b/i,
    value: 'comfort',
  },
  {
    pattern:
      /\b(?:reflective|thought[ -]?provoking|meaningful|emotional|deep|introspective)\b/i,
    value: 'reflective',
  },
  {
    pattern:
      /\b(?:tense|intense|high tension|edge of (?:my|your) seat|adrenaline)\b/i,
    value: 'tense',
  },
  {
    pattern:
      /\b(?:transporting|escapist|immersive|other world|epic world|sweeping|adventure|adventurous)\b/i,
    value: 'transporting',
  },
]

const languagePatterns = preferredLanguageOptions
  .filter(({ value }) => value !== 'any')
  .map(({ label, value }) => ({
    pattern: new RegExp(`\\b${label.toLowerCase()}\\b`, 'i'),
    value,
  }))

export function createDefaultIntentCriteria(): IntentSearchCriteria {
  return {
    decade: null,
    familyFriendly: false,
    genres: [],
    language: 'any',
    media: 'both',
    mood: defaultRecommendationMood,
    runtimeMaximum: null,
  }
}

function parseMedia(value: string): IntentMedia {
  const movie = /\b(?:movie|movies|film|films|cinema)\b/i.test(value)
  const tv = /\b(?:tv|television|series|show|shows)\b/i.test(value)

  if (movie && !tv) return 'movie'
  if (tv && !movie) return 'tv'

  return 'both'
}

function parseDecade(value: string): number | null {
  const fourDigit = /\b((?:19|20)\d0)s\b/i.exec(value)

  if (fourDigit) return Number(fourDigit[1])

  const shortDecade = /\b(?:the\s+)?['’]?(\d{2})s\b/i.exec(value)

  if (shortDecade) {
    const decade = Number(shortDecade[1])
    return decade <= CURRENT_DECADE % 100
      ? 2000 + decade
      : 1900 + decade
  }

  return null
}

function parseRuntimeMaximum(value: string): number | null {
  const hours =
    /\b(?:under|less than|no more than|within)\s+(\d+(?:\.\d+)?|one|two|three)\s*(?:hours?|hrs?)\b/i.exec(
      value,
    )

  if (hours) {
    const hourWords: Record<string, number> = {
      one: 1,
      three: 3,
      two: 2,
    }
    const hourValue =
      hourWords[hours[1].toLowerCase()] ?? Number(hours[1])

    return Math.min(
      Math.round(hourValue * 60),
      INTENT_RUNTIME_MAXIMUM,
    )
  }

  const minutes =
    /\b(?:under|less than|no more than|within)\s+(\d{2,3})\s*(?:minutes?|mins?)\b/i.exec(
      value,
    )

  if (minutes) {
    return Math.min(
      Number(minutes[1]),
      INTENT_RUNTIME_MAXIMUM,
    )
  }

  if (/\b(?:short|quick watch)\b/i.test(value)) {
    return 100
  }

  return null
}

function getGenreLabel(id: PreferenceGenreId): string {
  return (
    preferenceGenreDefinitions.find(
      (definition) => definition.id === id,
    )?.label ?? id
  )
}

export function parseNaturalLanguageIntent(
  value: string,
): ParsedSearchIntent {
  const normalized = value.trim().replace(/\s+/g, ' ')
  const criteria = createDefaultIntentCriteria()
  const recognizedSignals: string[] = []
  const hasRequestLanguage = requestPattern.test(normalized)

  criteria.media = parseMedia(normalized)
  if (criteria.media !== 'both') {
    recognizedSignals.push(
      criteria.media === 'movie' ? 'Movies' : 'TV series',
    )
  }

  const genres = genrePatterns.flatMap(({ id, pattern }) =>
    pattern.test(normalized) ? [id] : [],
  )

  criteria.genres = [...new Set(genres)].slice(0, INTENT_GENRE_LIMIT)
  criteria.genres.forEach((genre) =>
    recognizedSignals.push(getGenreLabel(genre)),
  )

  const mood = moodPatterns.find(({ pattern }) =>
    pattern.test(normalized),
  )?.value
  if (mood) {
    criteria.mood = mood
    recognizedSignals.push(
      getRecommendationMoodDefinition(mood).label,
    )
  }

  const language = languagePatterns.find(({ pattern }) =>
    pattern.test(normalized),
  )
  if (language) {
    criteria.language = language.value
    recognizedSignals.push(
      preferredLanguageOptions.find(
        ({ value: optionValue }) => optionValue === language.value,
      )!.label,
    )
  }

  criteria.decade = parseDecade(normalized)
  if (criteria.decade !== null) {
    recognizedSignals.push(`${criteria.decade}s`)
  }

  criteria.runtimeMaximum = parseRuntimeMaximum(normalized)
  if (criteria.runtimeMaximum !== null) {
    recognizedSignals.push(`${criteria.runtimeMaximum} min maximum`)
  }

  criteria.familyFriendly =
    /\b(?:family[ -]?friendly|kid[ -]?friendly|for (?:the )?(?:whole )?family|for kids|children can watch)\b/i.test(
      normalized,
    )
  if (criteria.familyFriendly) {
    if (!criteria.genres.includes('family')) {
      criteria.genres = [
        'family' as PreferenceGenreId,
        ...criteria.genres,
      ].slice(
        0,
        INTENT_GENRE_LIMIT,
      )
    }
    recognizedSignals.push('Family-oriented')
  }

  const uniqueSignals = [...new Set(recognizedSignals)]

  return {
    criteria,
    isIntent:
      normalized.length >= 2 &&
      (hasRequestLanguage || uniqueSignals.length >= 2),
    recognizedSignals: uniqueSignals,
  }
}

function isIntentMedia(value: string | null): value is IntentMedia {
  return intentMediaOptions.some((option) => option.value === value)
}

function isMood(value: string | null): value is RecommendationMoodId {
  return recommendationMoodDefinitions.some(
    (definition) => definition.value === value,
  )
}

function isLanguage(
  value: string | null,
): value is PreferredLanguage {
  return preferredLanguageOptions.some(
    (option) => option.value === value,
  )
}

export function serializeIntentSearch(
  query: string,
  criteria: IntentSearchCriteria,
): URLSearchParams {
  const searchParams = new URLSearchParams({
    intent: '1',
    mode: 'intent',
    q: query,
  })

  if (criteria.media !== 'both') {
    searchParams.set('media', criteria.media)
  }
  if (criteria.genres.length > 0) {
    searchParams.set('genres', criteria.genres.join(','))
  }
  if (criteria.mood !== defaultRecommendationMood) {
    searchParams.set('mood', criteria.mood)
  }
  if (criteria.language !== 'any') {
    searchParams.set('language', criteria.language)
  }
  if (criteria.decade !== null) {
    searchParams.set('decade', String(criteria.decade))
  }
  if (criteria.runtimeMaximum !== null) {
    searchParams.set('runtime', String(criteria.runtimeMaximum))
  }
  if (criteria.familyFriendly) {
    searchParams.set('family', '1')
  }

  return searchParams
}

export function parseIntentCriteria(
  searchParams: URLSearchParams,
  fallback: IntentSearchCriteria,
): IntentSearchCriteria {
  const base =
    searchParams.get('intent') === '1'
      ? createDefaultIntentCriteria()
      : fallback
  const mediaValue = searchParams.get('media')
  const moodValue = searchParams.get('mood')
  const languageValue = searchParams.get('language')
  const decadeValue = Number(searchParams.get('decade'))
  const runtimeValue = Number(searchParams.get('runtime'))
  const supportedGenres = new Set(
    preferenceGenreDefinitions.map(({ id }) => id),
  )
  const genres = (searchParams.get('genres') ?? '')
    .split(',')
    .filter(
      (genre): genre is PreferenceGenreId =>
        supportedGenres.has(genre as PreferenceGenreId),
    )

  return {
    decade:
      Number.isInteger(decadeValue) &&
      decadeValue >= 1900 &&
      decadeValue <= CURRENT_DECADE
        ? decadeValue
        : base.decade,
    familyFriendly:
      searchParams.get('family') === '1' ||
      base.familyFriendly,
    genres:
      genres.length > 0
        ? [...new Set(genres)].slice(0, INTENT_GENRE_LIMIT)
        : base.genres,
    language: isLanguage(languageValue)
      ? languageValue
      : base.language,
    media: isIntentMedia(mediaValue)
      ? mediaValue
      : base.media,
    mood: isMood(moodValue) ? moodValue : base.mood,
    runtimeMaximum:
      Number.isInteger(runtimeValue) &&
      runtimeValue >= 30 &&
      runtimeValue <= INTENT_RUNTIME_MAXIMUM
        ? runtimeValue
        : base.runtimeMaximum,
  }
}

function getRequestedGenres(
  criteria: IntentSearchCriteria,
): PreferenceGenreId[] {
  if (
    criteria.familyFriendly &&
    !criteria.genres.includes('family')
  ) {
    return [...criteria.genres, 'family']
  }

  return criteria.genres
}

function getGenreFilter(
  criteria: IntentSearchCriteria,
  mediaType: 'movie' | 'tv',
): string | null {
  const requestedGenres = getRequestedGenres(criteria)
  const explicitGroups = requestedGenres.flatMap((genre) => {
    const definition = preferenceGenreDefinitions.find(
      ({ id }) => id === genre,
    )

    const ids = mediaType === 'movie'
      ? (definition?.movieGenreIds ?? [])
      : (definition?.tvGenreIds ?? [])

    return ids.length > 0 ? [ids.join('|')] : []
  })

  if (explicitGroups.length > 0) {
    return [...new Set(explicitGroups)].join(',')
  }

  if (criteria.mood === defaultRecommendationMood) return null

  const mood = getRecommendationMoodDefinition(criteria.mood)
  const moodIds = mediaType === 'movie'
    ? mood.movieGenreIds
    : mood.tvGenreIds

  return moodIds.length > 0 ? moodIds.join('|') : null
}

export function supportsIntentMedia(
  criteria: IntentSearchCriteria,
  mediaType: 'movie' | 'tv',
): boolean {
  if (criteria.media !== 'both' && criteria.media !== mediaType) {
    return false
  }

  return getRequestedGenres(criteria).every((genre) => {
    const definition = preferenceGenreDefinitions.find(
      ({ id }) => id === genre,
    )
    const ids =
      mediaType === 'movie'
        ? definition?.movieGenreIds
        : definition?.tvGenreIds

    return Boolean(ids && ids.length > 0)
  })
}

export function buildIntentDiscoverQuery(
  criteria: IntentSearchCriteria,
  mediaType: 'movie' | 'tv',
  page: number,
): IntentQuery {
  const query: IntentQuery = {
    include_adult: false,
    language: 'en-US',
    page,
    sort_by: 'popularity.desc',
    'vote_count.gte': 50,
  }
  const genreFilter = getGenreFilter(criteria, mediaType)

  if (mediaType === 'movie') {
    query.include_video = false
  }
  if (genreFilter) {
    query.with_genres = genreFilter
  }
  if (criteria.language !== 'any') {
    query.with_original_language = criteria.language
  }
  if (criteria.runtimeMaximum !== null) {
    query['with_runtime.lte'] = criteria.runtimeMaximum
  }
  if (criteria.decade !== null) {
    const prefix =
      mediaType === 'movie'
        ? 'primary_release_date'
        : 'first_air_date'
    query[`${prefix}.gte`] = `${criteria.decade}-01-01`
    query[`${prefix}.lte`] = `${criteria.decade + 9}-12-31`
  }

  return query
}

export function getIntentQueryKey(
  criteria: IntentSearchCriteria,
  mediaType: 'movie' | 'tv',
) {
  return [
    'tmdb',
    'intent-discovery',
    mediaType,
    criteria,
  ] as const
}

function getIntentGenreReason(
  record: SearchRecord,
  criteria: IntentSearchCriteria,
): string | null {
  const labels = getRequestedGenres(criteria).flatMap((genre) => {
    const definition = preferenceGenreDefinitions.find(
      ({ id }) => id === genre,
    )
    const ids =
      record.mediaType === 'movie'
        ? definition?.movieGenreIds
        : definition?.tvGenreIds

    return ids?.some((id) => record.genreIds.includes(id))
      ? [definition!.label]
      : []
  })

  return labels.length > 0
    ? `Matches the ${labels.join(' + ').toLowerCase()} request.`
    : null
}

export function getIntentMatchReasons(
  record: SearchRecord,
  criteria: IntentSearchCriteria,
): string[] {
  const reasons: string[] = []
  const genreReason = getIntentGenreReason(record, criteria)

  if (genreReason) reasons.push(genreReason)
  if (
    criteria.mood !== defaultRecommendationMood &&
    getRecommendationMoodDefinition(
      criteria.mood,
    )[
      record.mediaType === 'movie'
        ? 'movieGenreIds'
        : 'tvGenreIds'
    ].some((id) => record.genreIds.includes(id)) &&
    reasons.length < 2
  ) {
    reasons.push(
      `Fits the ${getRecommendationMoodDefinition(criteria.mood).label.toLowerCase()} mood signal.`,
    )
  }
  if (
    criteria.language !== 'any' &&
    record.originalLanguage === criteria.language &&
    reasons.length < 2
  ) {
    const language = preferredLanguageOptions.find(
      ({ value }) => value === criteria.language,
    )!.label
    reasons.push(`Originally recorded in ${language}.`)
  }
  if (criteria.decade !== null && reasons.length < 2) {
    reasons.push(`Released in the ${criteria.decade}s.`)
  }
  if (criteria.runtimeMaximum !== null && reasons.length < 2) {
    reasons.push(
      `Filtered to runtimes up to ${criteria.runtimeMaximum} minutes.`,
    )
  }
  if (criteria.familyFriendly && reasons.length < 2) {
    reasons.push('Matches TMDB family catalogue genres.')
  }

  return reasons.length > 0
    ? reasons
    : ['Matches the interpreted viewing request.']
}

export function getNextIntentPage<T>(
  lastPage: TmdbPaginatedResponse<T>,
): number | undefined {
  const availablePages = Math.min(
    lastPage.total_pages,
    TMDB_PAGE_LIMIT,
  )

  return lastPage.page < availablePages
    ? lastPage.page + 1
    : undefined
}

function getYear(dateValue: string): string | null {
  return /^(\d{4})-\d{2}-\d{2}$/.exec(dateValue)?.[1] ?? null
}

function getScore(
  voteAverage: number,
  voteCount: number,
): number | null {
  return voteCount > 0 ? voteAverage : null
}

function getOverview(value: string): string | null {
  return value.trim() || null
}

function completeIntentRecord(
  record: SearchRecord,
  criteria: IntentSearchCriteria,
): SearchRecord {
  return {
    ...record,
    matchReasons: getIntentMatchReasons(record, criteria),
  }
}

export function adaptIntentMovie(
  movie: TmdbMovie,
  criteria: IntentSearchCriteria,
): SearchRecord {
  const record: SearchRecord = {
    dateYear: getYear(movie.release_date),
    genreIds: movie.genre_ids,
    id: movie.id,
    imagePath: movie.poster_path,
    imageType: 'poster',
    knownForDepartment: null,
    matchReasons: [],
    mediaType: 'movie',
    originalLanguage: movie.original_language.trim() || null,
    overview: getOverview(movie.overview),
    score: getScore(movie.vote_average, movie.vote_count),
    title:
      movie.title.trim() ||
      movie.original_title.trim() ||
      'Untitled film record',
    voteCount: movie.vote_count,
  }

  return completeIntentRecord(record, criteria)
}

export function adaptIntentTvShow(
  show: TmdbTvShow,
  criteria: IntentSearchCriteria,
): SearchRecord {
  const record: SearchRecord = {
    dateYear: getYear(show.first_air_date),
    genreIds: show.genre_ids,
    id: show.id,
    imagePath: show.poster_path,
    imageType: 'poster',
    knownForDepartment: null,
    matchReasons: [],
    mediaType: 'tv',
    originalLanguage: show.original_language.trim() || null,
    overview: getOverview(show.overview),
    score: getScore(show.vote_average, show.vote_count),
    title:
      show.name.trim() ||
      show.original_name.trim() ||
      'Untitled television record',
    voteCount: show.vote_count,
  }

  return completeIntentRecord(record, criteria)
}

export function flattenIntentPages(
  moviePages:
    | ReadonlyArray<TmdbPaginatedResponse<TmdbMovie>>
    | undefined,
  tvPages:
    | ReadonlyArray<TmdbPaginatedResponse<TmdbTvShow>>
    | undefined,
  criteria: IntentSearchCriteria,
): SearchRecord[] {
  const movies = (moviePages ?? []).flatMap((page) =>
    page.results.map((movie) =>
      adaptIntentMovie(movie, criteria),
    ),
  )
  const shows = (tvPages ?? []).flatMap((page) =>
    page.results.map((show) =>
      adaptIntentTvShow(show, criteria),
    ),
  )
  const records: SearchRecord[] = []
  const seen = new Set<string>()
  const maximumLength = Math.max(movies.length, shows.length)

  for (let index = 0; index < maximumLength; index += 1) {
    const pair = [movies[index], shows[index]]

    pair.forEach((record) => {
      if (!record) return

      const key = `${record.mediaType}:${record.id}`
      if (seen.has(key)) return

      seen.add(key)
      records.push(record)
    })
  }

  return records
}
