import {
  defaultMovieDiscoveryFilters,
  type MovieDiscoveryFilters,
  type MovieDiscoverySort,
  type MovieMinimumScore,
  type MovieReleasePeriod,
  type MovieRuntimeRange,
} from './movieDiscovery'

export const movieSortOptions: ReadonlyArray<{
  label: string
  value: MovieDiscoverySort
}> = [
  {
    label: 'TMDB popularity',
    value: 'popularity',
  },
  {
    label: 'TMDB audience rating',
    value: 'rating',
  },
  {
    label: 'Most recorded votes',
    value: 'vote-count',
  },
  {
    label: 'Recent primary releases',
    value: 'recent',
  },
]

export const movieReleasePeriodOptions: ReadonlyArray<{
  label: string
  value: MovieReleasePeriod
}> = [
  {
    label: 'Any release period',
    value: 'all',
  },
  {
    label: '2020 to today',
    value: '2020s',
  },
  {
    label: '2010–2019',
    value: '2010s',
  },
  {
    label: '2000–2009',
    value: '2000s',
  },
  {
    label: '1990–1999',
    value: '1990s',
  },
  {
    label: 'Before 1990',
    value: 'before-1990',
  },
]

export const movieRuntimeOptions: ReadonlyArray<{
  label: string
  value: MovieRuntimeRange
}> = [
  {
    label: 'Any runtime',
    value: 'all',
  },
  {
    label: 'Under 90 minutes',
    value: 'under-90',
  },
  {
    label: '90–120 minutes',
    value: '90-to-120',
  },
  {
    label: 'Over 120 minutes',
    value: 'over-120',
  },
]

export const movieMinimumScoreOptions: ReadonlyArray<{
  label: string
  value: MovieMinimumScore
}> = [
  {
    label: 'Any TMDB score',
    value: 'all',
  },
  {
    label: '6.0 or higher',
    value: '6',
  },
  {
    label: '7.0 or higher',
    value: '7',
  },
  {
    label: '8.0 or higher',
    value: '8',
  },
]

function parseOption<T extends string>(
  value: string | null,
  options: ReadonlyArray<{ value: T }>,
  fallback: T,
): T {
  if (
    value &&
    options.some((option) => option.value === value)
  ) {
    return value as T
  }

  return fallback
}

function parseGenreId(
  value: string | null,
): number | null {
  if (!value) {
    return null
  }

  const genreId = Number(value)

  if (
    !Number.isInteger(genreId) ||
    genreId <= 0
  ) {
    return null
  }

  return genreId
}

export function parseMovieDiscoveryFilters(
  searchParams: URLSearchParams,
): MovieDiscoveryFilters {
  return {
    genreId: parseGenreId(
      searchParams.get('genre'),
    ),
    minimumScore: parseOption(
      searchParams.get('score'),
      movieMinimumScoreOptions,
      defaultMovieDiscoveryFilters.minimumScore,
    ),
    releasePeriod: parseOption(
      searchParams.get('period'),
      movieReleasePeriodOptions,
      defaultMovieDiscoveryFilters.releasePeriod,
    ),
    runtime: parseOption(
      searchParams.get('runtime'),
      movieRuntimeOptions,
      defaultMovieDiscoveryFilters.runtime,
    ),
    sort: parseOption(
      searchParams.get('sort'),
      movieSortOptions,
      defaultMovieDiscoveryFilters.sort,
    ),
  }
}

export function serializeMovieDiscoveryFilters(
  filters: MovieDiscoveryFilters,
): URLSearchParams {
  const searchParams = new URLSearchParams()

  if (filters.genreId !== null) {
    searchParams.set(
      'genre',
      String(filters.genreId),
    )
  }

  if (
    filters.sort !==
    defaultMovieDiscoveryFilters.sort
  ) {
    searchParams.set('sort', filters.sort)
  }

  if (
    filters.releasePeriod !==
    defaultMovieDiscoveryFilters.releasePeriod
  ) {
    searchParams.set(
      'period',
      filters.releasePeriod,
    )
  }

  if (
    filters.runtime !==
    defaultMovieDiscoveryFilters.runtime
  ) {
    searchParams.set(
      'runtime',
      filters.runtime,
    )
  }

  if (
    filters.minimumScore !==
    defaultMovieDiscoveryFilters.minimumScore
  ) {
    searchParams.set(
      'score',
      filters.minimumScore,
    )
  }

  return searchParams
}

function getSortDescription(
  sort: MovieDiscoverySort,
): string {
  switch (sort) {
    case 'rating':
      return 'TMDB audience rating with at least 200 recorded votes'

    case 'vote-count':
      return 'recorded rating volume'

    case 'recent':
      return 'primary release date, newest first'

    case 'popularity':
      return 'TMDB popularity'
  }
}

function getReleaseDescription(
  releasePeriod: MovieReleasePeriod,
): string {
  switch (releasePeriod) {
    case '2020s':
      return 'released from 2020 through today'

    case '2010s':
      return 'released from 2010 through 2019'

    case '2000s':
      return 'released from 2000 through 2009'

    case '1990s':
      return 'released from 1990 through 1999'

    case 'before-1990':
      return 'released before 1990'

    case 'all':
      return 'from any release period through today'
  }
}

function getRuntimeDescription(
  runtime: MovieRuntimeRange,
): string {
  switch (runtime) {
    case 'under-90':
      return 'running under 90 minutes'

    case '90-to-120':
      return 'running from 90 to 120 minutes'

    case 'over-120':
      return 'running over 120 minutes'

    case 'all':
      return 'with any recorded runtime'
  }
}

function getScoreDescription(
  minimumScore: MovieMinimumScore,
): string | null {
  if (minimumScore === 'all') {
    return null
  }

  return `with a TMDB user score of ${minimumScore}.0 or higher`
}

export function getMovieDiscoveryMethodLabel(
  filters: MovieDiscoveryFilters,
  genreName: string | null,
): string {
  const subject = genreName
    ? `${genreName} films`
    : 'Films'

  const descriptions = [
    getReleaseDescription(filters.releasePeriod),
    getRuntimeDescription(filters.runtime),
    getScoreDescription(filters.minimumScore),
  ].filter(
    (description): description is string =>
      description !== null,
  )

  return `${subject} ${descriptions.join(
    ', ',
  )}, ordered by ${getSortDescription(filters.sort)}.`
}

export function isDefaultMovieDiscoveryFilters(
  filters: MovieDiscoveryFilters,
): boolean {
  return (
    filters.genreId === null &&
    filters.minimumScore ===
      defaultMovieDiscoveryFilters.minimumScore &&
    filters.releasePeriod ===
      defaultMovieDiscoveryFilters.releasePeriod &&
    filters.runtime ===
      defaultMovieDiscoveryFilters.runtime &&
    filters.sort ===
      defaultMovieDiscoveryFilters.sort
  )
}
