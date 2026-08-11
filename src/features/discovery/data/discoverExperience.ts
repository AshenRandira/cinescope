import type {
  TmdbMovie,
  TmdbMultiSearchResult,
  TmdbPaginatedResponse,
  TmdbTvShow,
} from '../../../types/tmdb'

export type DiscoverSignalId =
  | 'current'
  | 'quiet'
  | 'pressure'
  | 'brief'
  | 'episodic'
  | 'archive'

export type DiscoverMediaType = 'movie' | 'tv'

export type DiscoverRecord = {
  backdropPath: string | null
  dateYear: string | null
  genreIds: number[]
  id: number
  mediaType: DiscoverMediaType
  originalLanguage: string
  overview: string | null
  posterPath: string | null
  score: number | null
  title: string
  voteCount: number
}

type DiscoverQuery = Record<
  string,
  string | number | boolean
>

export type DiscoverSignalDefinition = {
  description: string
  endpoint:
    | '/trending/all/week'
    | '/discover/movie'
    | '/discover/tv'
    | null
  index: string
  label: string
  mediaType: DiscoverMediaType | 'mixed'
  method: string
  query: DiscoverQuery
  title: string
  value: DiscoverSignalId
}

const DISCOVER_PAGE_LIMIT = 10

export const defaultDiscoverSignal: DiscoverSignalId =
  'current'

export const discoverSignalDefinitions: ReadonlyArray<DiscoverSignalDefinition> =
  [
    {
      description:
        'Films and series crossing the strongest weekly attention signals at this moment.',
      endpoint: '/trending/all/week',
      index: '01',
      label: 'Current collision',
      mediaType: 'mixed',
      method:
        'Weekly TMDB trending records, excluding people and adult-flagged entries. Attention is not treated as quality.',
      query: {
        language: 'en-US',
      },
      title: 'See what is colliding with the present.',
      value: 'current',
    },
    {
      description:
        'Measured films carrying dramatic, mysterious, or speculative atmosphere.',
      endpoint: '/discover/movie',
      index: '02',
      label: 'Quiet and strange',
      mediaType: 'movie',
      method:
        'Drama, mystery, and science-fiction signals with meaningful audience activity; action and war genres are excluded where possible.',
      query: {
        include_adult: false,
        include_video: false,
        language: 'en-US',
        sort_by: 'vote_average.desc',
        'vote_average.gte': 6.4,
        'vote_count.gte': 250,
        with_genres: '18|9648|878',
        without_genres: '28|10752',
      },
      title: 'Leave room for the unexplained.',
      value: 'quiet',
    },
    {
      description:
        'Thrillers, mysteries, and crime stories moving under sustained pressure.',
      endpoint: '/discover/movie',
      index: '03',
      label: 'Under pressure',
      mediaType: 'movie',
      method:
        'Thriller, crime, and mystery records ordered by current TMDB popularity with score and vote-count thresholds.',
      query: {
        include_adult: false,
        include_video: false,
        language: 'en-US',
        sort_by: 'popularity.desc',
        'vote_average.gte': 6,
        'vote_count.gte': 350,
        with_genres: '53|80|9648',
      },
      title: 'Follow the decision that tightens everything.',
      value: 'pressure',
    },
    {
      description:
        'Complete feature worlds that fit inside a two-hour viewing window.',
      endpoint: '/discover/movie',
      index: '04',
      label: 'Brief encounter',
      mediaType: 'movie',
      method:
        'Released features running from 75 to 120 minutes with established rating and vote activity.',
      query: {
        include_adult: false,
        include_video: false,
        language: 'en-US',
        sort_by: 'popularity.desc',
        'vote_average.gte': 6.2,
        'vote_count.gte': 500,
        'with_runtime.gte': 75,
        'with_runtime.lte': 120,
      },
      title: 'Find a complete world before the clock turns.',
      value: 'brief',
    },
    {
      description:
        'Episodic records with a durable audience response beyond the immediate broadcast cycle.',
      endpoint: '/discover/tv',
      index: '05',
      label: 'Long signal',
      mediaType: 'tv',
      method:
        'Television records ordered by audience rating with adult-flagged entries removed and at least 300 recorded votes.',
      query: {
        include_adult: false,
        language: 'en-US',
        sort_by: 'vote_average.desc',
        'vote_count.gte': 300,
      },
      title: 'Stay with a story beyond one sitting.',
      value: 'episodic',
    },
    {
      description:
        'Films and series connected to the strongest signals in your own CineScope archive.',
      endpoint: null,
      index: '06',
      label: 'From your archive',
      mediaType: 'mixed',
      method:
        'Up to four favourites and ratings of 7 or higher become visible anchors. If no positive rating signal exists, CineScope falls back to recent unrated saves, then combines their TMDB recommendation paths and removes titles already in your archive.',
      query: {},
      title: 'Follow the traces left by your archive.',
      value: 'archive',
    },
  ]

export function parseDiscoverSignal(
  value: string | null,
): DiscoverSignalId {
  const definition = discoverSignalDefinitions.find(
    (candidate) => candidate.value === value,
  )

  return definition?.value ?? defaultDiscoverSignal
}

export function parseDiscoverPage(
  value: string | null,
): number {
  const page = Number(value)

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    page > DISCOVER_PAGE_LIMIT
  ) {
    return 1
  }

  return page
}

export function getDiscoverSignalDefinition(
  signal: DiscoverSignalId,
): DiscoverSignalDefinition {
  return (
    discoverSignalDefinitions.find(
      (definition) =>
        definition.value === signal,
    ) ?? discoverSignalDefinitions[0]
  )
}

export function serializeDiscoverState(
  signal: DiscoverSignalId,
  page: number,
): URLSearchParams {
  const searchParams = new URLSearchParams()

  if (signal !== defaultDiscoverSignal) {
    searchParams.set('signal', signal)
  }

  if (page > 1) {
    searchParams.set('page', String(page))
  }

  return searchParams
}

export function getDiscoverQueryKey(
  signal: DiscoverSignalId,
  page: number,
) {
  return [
    'tmdb',
    'discover-experience',
    signal,
    page,
    'en-US',
  ] as const
}

export function buildDiscoverQuery(
  definition: DiscoverSignalDefinition,
  page: number,
): DiscoverQuery {
  return {
    ...definition.query,
    page,
  }
}

function getYear(value: string): string | null {
  const match = /^(\d{4})-\d{2}-\d{2}$/.exec(
    value,
  )

  return match?.[1] ?? null
}

export function adaptMovie(
  movie: TmdbMovie,
): DiscoverRecord {
  return {
    backdropPath: movie.backdrop_path,
    dateYear: getYear(movie.release_date),
    genreIds: [...movie.genre_ids],
    id: movie.id,
    mediaType: 'movie',
    originalLanguage:
      movie.original_language.trim() || 'und',
    overview: movie.overview.trim() || null,
    posterPath: movie.poster_path,
    score:
      movie.vote_count > 0
        ? movie.vote_average
        : null,
    title:
      movie.title.trim() ||
      movie.original_title.trim() ||
      'Untitled film record',
    voteCount: movie.vote_count,
  }
}

export function adaptTv(
  show: TmdbTvShow,
): DiscoverRecord {
  return {
    backdropPath: show.backdrop_path,
    dateYear: getYear(show.first_air_date),
    genreIds: [...show.genre_ids],
    id: show.id,
    mediaType: 'tv',
    originalLanguage:
      show.original_language.trim() || 'und',
    overview: show.overview.trim() || null,
    posterPath: show.poster_path,
    score:
      show.vote_count > 0
        ? show.vote_average
        : null,
    title:
      show.name.trim() ||
      show.original_name.trim() ||
      'Untitled television record',
    voteCount: show.vote_count,
  }
}

type DiscoverApiRecord =
  | TmdbMovie
  | TmdbTvShow
  | TmdbMultiSearchResult

export function selectDiscoverRecords(
  response: TmdbPaginatedResponse<DiscoverApiRecord>,
  definition: DiscoverSignalDefinition,
): DiscoverRecord[] {
  const records: DiscoverRecord[] = []
  const seenRecords = new Set<string>()

  response.results.forEach((result) => {
    if (result.adult) return

    const mediaType =
      'media_type' in result
        ? result.media_type
        : definition.mediaType

    if (
      mediaType !== 'movie' &&
      mediaType !== 'tv'
    ) {
      return
    }

    const recordKey = `${mediaType}:${result.id}`
    if (seenRecords.has(recordKey)) return

    const record =
      mediaType === 'movie'
        ? adaptMovie(result as TmdbMovie)
        : adaptTv(result as TmdbTvShow)

    if (!record.posterPath && !record.backdropPath) {
      return
    }

    seenRecords.add(recordKey)
    records.push(record)
  })

  return records
}

export function getAvailableDiscoverPages(
  totalPages: number,
): number {
  return Math.max(
    1,
    Math.min(totalPages, DISCOVER_PAGE_LIMIT),
  )
}
