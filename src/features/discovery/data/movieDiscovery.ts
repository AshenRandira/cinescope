import type {
  TmdbMovie,
  TmdbPaginatedResponse,
} from '../../../types/tmdb'

export type MovieDiscoverySort =
  | 'popularity'
  | 'rating'
  | 'vote-count'
  | 'recent'

export type MovieReleasePeriod =
  | 'all'
  | '2020s'
  | '2010s'
  | '2000s'
  | '1990s'
  | 'before-1990'

export type MovieRuntimeRange =
  | 'all'
  | 'under-90'
  | '90-to-120'
  | 'over-120'

export type MovieMinimumScore =
  | 'all'
  | '6'
  | '7'
  | '8'

export type MovieDiscoveryFilters = {
  genreId: number | null
  minimumScore: MovieMinimumScore
  releasePeriod: MovieReleasePeriod
  runtime: MovieRuntimeRange
  sort: MovieDiscoverySort
}

export type MovieDiscoveryRecord = {
  backdropPath: string | null
  genreIds: number[]
  id: number
  originalLanguage: string
  overview: string | null
  posterPath: string | null
  releaseDate: string | null
  releaseYear: string | null
  title: string
  voteAverage: number | null
  voteCount: number
}

type MovieDiscoveryQuery = Record<
  string,
  string | number | boolean
>

const TMDB_PAGE_LIMIT = 500

export const defaultMovieDiscoveryFilters =
  Object.freeze<MovieDiscoveryFilters>({
    genreId: null,
    minimumScore: 'all',
    releasePeriod: 'all',
    runtime: 'all',
    sort: 'popularity',
  })

export const movieGenreQueryKey = [
  'tmdb',
  'movie-genres',
  'en-US',
] as const

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getReleasePeriodQuery(
  releasePeriod: MovieReleasePeriod,
  today: string,
): MovieDiscoveryQuery {
  switch (releasePeriod) {
    case '2020s':
      return {
        'primary_release_date.gte': '2020-01-01',
        'primary_release_date.lte': today,
      }

    case '2010s':
      return {
        'primary_release_date.gte': '2010-01-01',
        'primary_release_date.lte': '2019-12-31',
      }

    case '2000s':
      return {
        'primary_release_date.gte': '2000-01-01',
        'primary_release_date.lte': '2009-12-31',
      }

    case '1990s':
      return {
        'primary_release_date.gte': '1990-01-01',
        'primary_release_date.lte': '1999-12-31',
      }

    case 'before-1990':
      return {
        'primary_release_date.lte': '1989-12-31',
      }

    case 'all':
      return {
        'primary_release_date.lte': today,
      }
  }
}

function getRuntimeQuery(
  runtime: MovieRuntimeRange,
): MovieDiscoveryQuery {
  switch (runtime) {
    case 'under-90':
      return {
        'with_runtime.lte': 89,
      }

    case '90-to-120':
      return {
        'with_runtime.gte': 90,
        'with_runtime.lte': 120,
      }

    case 'over-120':
      return {
        'with_runtime.gte': 121,
      }

    case 'all':
      return {}
  }
}

function getSortQuery(
  sort: MovieDiscoverySort,
): MovieDiscoveryQuery {
  switch (sort) {
    case 'rating':
      return {
        sort_by: 'vote_average.desc',
        'vote_count.gte': 200,
      }

    case 'vote-count':
      return {
        sort_by: 'vote_count.desc',
      }

    case 'recent':
      return {
        sort_by: 'primary_release_date.desc',
      }

    case 'popularity':
      return {
        sort_by: 'popularity.desc',
      }
  }
}

function getMinimumScoreQuery(
  minimumScore: MovieMinimumScore,
): MovieDiscoveryQuery {
  if (minimumScore === 'all') {
    return {}
  }

  return {
    'vote_average.gte': Number(minimumScore),
  }
}

export function getMovieDiscoveryQueryKey(
  filters: MovieDiscoveryFilters,
) {
  return [
    'tmdb',
    'movie-discovery',
    {
      genreId: filters.genreId,
      minimumScore: filters.minimumScore,
      releasePeriod: filters.releasePeriod,
      runtime: filters.runtime,
      sort: filters.sort,
    },
  ] as const
}

export function buildMovieDiscoveryQuery(
  filters: MovieDiscoveryFilters,
  page: number,
): MovieDiscoveryQuery {
  const today = formatLocalDate(new Date())

  return {
    include_adult: false,
    include_video: false,
    language: 'en-US',
    page,
    ...getSortQuery(filters.sort),
    ...getReleasePeriodQuery(
      filters.releasePeriod,
      today,
    ),
    ...getRuntimeQuery(filters.runtime),
    ...getMinimumScoreQuery(filters.minimumScore),
    ...(filters.genreId === null
      ? {}
      : {
          with_genres: filters.genreId,
        }),
  }
}

export function getNextMovieDiscoveryPage(
  lastPage: TmdbPaginatedResponse<TmdbMovie>,
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

function getReleaseDate(
  releaseDate: string,
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) {
    return null
  }

  return releaseDate
}

function getMovieTitle(movie: TmdbMovie): string {
  const title = movie.title.trim()

  if (title) {
    return title
  }

  const originalTitle = movie.original_title.trim()

  if (originalTitle) {
    return originalTitle
  }

  return 'Untitled film record'
}

export function adaptMovieDiscoveryRecord(
  movie: TmdbMovie,
): MovieDiscoveryRecord {
  const releaseDate = getReleaseDate(movie.release_date)
  const overview = movie.overview.trim()

  return {
    backdropPath: movie.backdrop_path,
    genreIds: movie.genre_ids,
    id: movie.id,
    originalLanguage:
      movie.original_language.trim() || 'und',
    overview: overview || null,
    posterPath: movie.poster_path,
    releaseDate,
    releaseYear: releaseDate?.slice(0, 4) ?? null,
    title: getMovieTitle(movie),
    voteAverage:
      movie.vote_count > 0
        ? movie.vote_average
        : null,
    voteCount: movie.vote_count,
  }
}

export function flattenMovieDiscoveryPages(
  pages:
    | ReadonlyArray<TmdbPaginatedResponse<TmdbMovie>>
    | undefined,
): MovieDiscoveryRecord[] {
  if (!pages) {
    return []
  }

  const seenMovieIds = new Set<number>()
  const records: MovieDiscoveryRecord[] = []

  pages.forEach((page) => {
    page.results.forEach((movie) => {
      if (seenMovieIds.has(movie.id)) {
        return
      }

      seenMovieIds.add(movie.id)
      records.push(adaptMovieDiscoveryRecord(movie))
    })
  })

  return records
}
