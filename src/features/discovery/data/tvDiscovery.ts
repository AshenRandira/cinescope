import type {
  TmdbPaginatedResponse,
  TmdbTvShow,
} from '../../../types/tmdb'

export type TvDiscoveryView =
  | 'popular'
  | 'top-rated'
  | 'on-air'
  | 'airing-today'

export type TvDiscoveryRecord = {
  backdropPath: string | null
  firstAirDate: string | null
  firstAirYear: string | null
  genreIds: number[]
  id: number
  name: string
  originalLanguage: string
  originCountries: string[]
  overview: string | null
  posterPath: string | null
  voteAverage: number | null
  voteCount: number
}

export type TvDiscoveryViewOption = {
  description: string
  eyebrow: string
  label: string
  value: TvDiscoveryView
}

const TMDB_PAGE_LIMIT = 500

export const defaultTvDiscoveryView: TvDiscoveryView =
  'popular'

export const tvDiscoveryViewOptions: ReadonlyArray<TvDiscoveryViewOption> =
  [
    {
      description:
        'Series currently drawing attention across the TMDB catalogue.',
      eyebrow: 'Current attention',
      label: 'Popular',
      value: 'popular',
    },
    {
      description:
        'Highly rated series with enough recorded votes to reduce fragile rankings.',
      eyebrow: 'Audience record',
      label: 'Top rated',
      value: 'top-rated',
    },
    {
      description:
        'Series with broadcasts scheduled within the current seven-day window.',
      eyebrow: 'Weekly signal',
      label: 'On the air',
      value: 'on-air',
    },
    {
      description:
        'Series with episodes listed for broadcast today in the TMDB catalogue.',
      eyebrow: 'Daily signal',
      label: 'Airing today',
      value: 'airing-today',
    },
  ]

export const tvGenreQueryKey = [
  'tmdb',
  'tv-genres',
  'en-US',
] as const

export function parseTvDiscoveryView(
  value: string | null,
): TvDiscoveryView {
  const option = tvDiscoveryViewOptions.find(
    (candidate) => candidate.value === value,
  )

  return option?.value ?? defaultTvDiscoveryView
}

export function serializeTvDiscoveryView(
  view: TvDiscoveryView,
): URLSearchParams {
  const searchParams = new URLSearchParams()

  if (view !== defaultTvDiscoveryView) {
    searchParams.set('view', view)
  }

  return searchParams
}

export function getTvDiscoveryViewOption(
  view: TvDiscoveryView,
): TvDiscoveryViewOption {
  return (
    tvDiscoveryViewOptions.find(
      (option) => option.value === view,
    ) ?? tvDiscoveryViewOptions[0]
  )
}

export function getTvDiscoveryQueryKey(
  view: TvDiscoveryView,
) {
  return [
    'tmdb',
    'tv-discovery',
    view,
    'en-US',
  ] as const
}

export function getTvDiscoveryPath(
  view: TvDiscoveryView,
): string {
  switch (view) {
    case 'popular':
      return '/tv/popular'

    case 'top-rated':
      return '/tv/top_rated'

    case 'on-air':
      return '/tv/on_the_air'

    case 'airing-today':
      return '/tv/airing_today'
  }
}

export function getNextTvDiscoveryPage(
  lastPage: TmdbPaginatedResponse<TmdbTvShow>,
): number | undefined {
  const availablePages = Math.min(
    lastPage.total_pages,
    TMDB_PAGE_LIMIT,
  )

  if (lastPage.page >= availablePages) {
    return undefined
  }

  return lastPage.page + 1
}

function getFirstAirDate(
  value: string,
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  return value
}

function getTvTitle(show: TmdbTvShow): string {
  return (
    show.name.trim() ||
    show.original_name.trim() ||
    'Untitled television record'
  )
}

export function adaptTvDiscoveryRecord(
  show: TmdbTvShow,
): TvDiscoveryRecord {
  const firstAirDate = getFirstAirDate(
    show.first_air_date,
  )
  const overview = show.overview.trim()

  return {
    backdropPath: show.backdrop_path,
    firstAirDate,
    firstAirYear:
      firstAirDate?.slice(0, 4) ?? null,
    genreIds: show.genre_ids,
    id: show.id,
    name: getTvTitle(show),
    originalLanguage:
      show.original_language.trim() || 'und',
    originCountries: show.origin_country.filter(
      Boolean,
    ),
    overview: overview || null,
    posterPath: show.poster_path,
    voteAverage:
      show.vote_count > 0
        ? show.vote_average
        : null,
    voteCount: show.vote_count,
  }
}

export function flattenTvDiscoveryPages(
  pages:
    | ReadonlyArray<
        TmdbPaginatedResponse<TmdbTvShow>
      >
    | undefined,
): TvDiscoveryRecord[] {
  if (!pages) {
    return []
  }

  const seenShowIds = new Set<number>()
  const records: TvDiscoveryRecord[] = []

  pages.forEach((page) => {
    page.results.forEach((show) => {
      if (
        show.adult ||
        seenShowIds.has(show.id)
      ) {
        return
      }

      seenShowIds.add(show.id)
      records.push(adaptTvDiscoveryRecord(show))
    })
  })

  return records
}
