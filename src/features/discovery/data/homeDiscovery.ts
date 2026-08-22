import type {
    TmdbMovie,
    TmdbTvShow,
  } from '../../../types/tmdb'

  export type DiscoveryCutId =
    | 'quiet-and-strange'
    | 'high-tension'
    | 'stories-under-two-hours'

  export type TemporalStationId =
    | 'archive-return'
    | 'current-signal'
    | 'in-release'
    | 'on-approach'

  export type TelevisionSignalId =
    | 'current-frequency'
    | 'broadcast-window'

  type HomeMediaQuery = Record<
    string,
    string | number | boolean
  >

  export type DiscoveryCutDefinition = {
    description: string
    id: DiscoveryCutId
    index: string
    label: string
    method: string
    query: HomeMediaQuery
    title: string
  }

  export type DiscoveryCut = Omit<
    DiscoveryCutDefinition,
    'query'
  > & {
    movies: TmdbMovie[]
  }

  export type TemporalStationDefinition = {
    cue: string
    description: string
    endpoint:
      | '/discover/movie'
      | '/movie/now_playing'
      | '/movie/upcoming'
      | '/trending/movie/week'
    id: TemporalStationId
    index: string
    label: string
    query: HomeMediaQuery
    sourceNote: string
  }

  export type TemporalStation = Omit<
    TemporalStationDefinition,
    'endpoint' | 'query'
  > & {
    movies: TmdbMovie[]
  }

  export type TelevisionSignalDefinition = {
    cue: string
    description: string
    endpoint:
      | '/trending/tv/week'
      | '/tv/on_the_air'
    id: TelevisionSignalId
    index: string
    label: string
    query: HomeMediaQuery
    sourceNote: string
  }

  export type TelevisionSignal = Omit<
    TelevisionSignalDefinition,
    'endpoint' | 'query'
  > & {
    shows: TmdbTvShow[]
  }

  export const homeFeaturedQueryKey = [
    'tmdb',
    'home',
    'featured-movies',
  ] as const

  function formatLocalDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  function getDateYearsAgo(years: number): string {
    const date = new Date()

    date.setFullYear(date.getFullYear() - years)

    return formatLocalDate(date)
  }

  function getBrowserTimeZone(): string {
    return (
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      'UTC'
    )
  }

  const today = formatLocalDate(new Date())
  const archiveCutoffDate = getDateYearsAgo(10)
  const archiveCutoffYear = archiveCutoffDate.slice(0, 4)
  const browserTimeZone = getBrowserTimeZone()

  export const discoveryCutDefinitions = [
    {
      id: 'quiet-and-strange',
      index: '01',
      label: 'Quiet and strange',
      title: 'Stories that leave space for the unexplained.',
      description:
        'Atmospheric drama, mystery, and science fiction.',
      method:
        'Uses well-rated titles with an established audience. Action and war films are filtered out where possible.',
      query: {
        include_adult: false,
        include_video: false,
        language: 'en-US',
        page: 1,
        sort_by: 'vote_average.desc',
        'vote_average.gte': 6.4,
        'vote_count.gte': 250,
        with_genres: '18|9648|878',
        without_genres: '28|10752',
      },
    },
    {
      id: 'high-tension',
      index: '02',
      label: 'High tension',
      title: 'Pressure building one decision at a time.',
      description:
        'Popular thrillers, mysteries, and crime stories.',
      method:
        'Orders titles by TMDB popularity and requires a reliable number of audience votes.',
      query: {
        include_adult: false,
        include_video: false,
        language: 'en-US',
        page: 1,
        sort_by: 'popularity.desc',
        'vote_average.gte': 6,
        'vote_count.gte': 350,
        with_genres: '53|80|9648',
      },
    },
    {
      id: 'stories-under-two-hours',
      index: '03',
      label: 'Under two hours',
      title: 'Complete worlds that respect the clock.',
      description:
        'Released movies between 75 minutes and two hours.',
      method:
        'Uses runtime, popularity, rating, and vote filters. This list is not personalized.',
      query: {
        include_adult: false,
        include_video: false,
        language: 'en-US',
        page: 1,
        sort_by: 'popularity.desc',
        'primary_release_date.lte': today,
        'vote_average.gte': 6.2,
        'vote_count.gte': 500,
        'with_runtime.gte': 75,
        'with_runtime.lte': 120,
      },
    },
  ] as const satisfies readonly DiscoveryCutDefinition[]

  export const temporalStationDefinitions = [
    {
      id: 'archive-return',
      index: '01',
      label: 'Archive return',
      cue: `Before ${archiveCutoffYear}`,
      description:
        'Earlier works surfacing through present-day TMDB popularity signals.',
      sourceNote:
        'Popularity-sorted catalogue records released at least ten years ago.',
      endpoint: '/discover/movie',
      query: {
        include_adult: false,
        include_video: false,
        language: 'en-US',
        page: 1,
        sort_by: 'popularity.desc',
        'primary_release_date.lte': archiveCutoffDate,
        'vote_average.gte': 6.2,
        'vote_count.gte': 1000,
      },
    },
    {
      id: 'current-signal',
      index: '02',
      label: 'Trending movies',
      cue: 'This week',
      description:
        'Movies receiving the strongest weekly attention across TMDB.',
      sourceNote:
        'Weekly trends show attention, not lasting quality or personal taste.',
      endpoint: '/trending/movie/week',
      query: {
        language: 'en-US',
      },
    },
    {
      id: 'in-release',
      index: '03',
      label: 'In release',
      cue: 'In theatres',
      description:
        'Movies TMDB currently reports as playing in theatres.',
      sourceNote:
        'Release availability can vary by territory and local cinema schedule.',
      endpoint: '/movie/now_playing',
      query: {
        language: 'en-US',
        page: 1,
      },
    },
    {
      id: 'on-approach',
      index: '04',
      label: 'On approach',
      cue: 'Coming soon',
      description:
        'Upcoming releases moving toward the present.',
      sourceNote:
        'Only titles with a future primary release date are shown.',
      endpoint: '/movie/upcoming',
      query: {
        language: 'en-US',
        page: 1,
      },
    },
  ] as const satisfies readonly TemporalStationDefinition[]

  export const televisionSignalDefinitions = [
    {
      id: 'current-frequency',
      index: '01',
      label: 'Trending series',
      cue: 'Trending this week',
      description:
        'Series currently receiving strong weekly attention across TMDB.',
      sourceNote:
        'Weekly trends are not personalized and do not measure lasting quality.',
      endpoint: '/trending/tv/week',
      query: {
        language: 'en-US',
      },
    },
    {
      id: 'broadcast-window',
      index: '02',
      label: 'Broadcast window',
      cue: 'Next seven days',
      description:
        'Series with episodes airing during TMDB’s current seven-day window.',
      sourceNote:
        'Air dates vary by region and network. Times use your browser timezone.',
      endpoint: '/tv/on_the_air',
      query: {
        language: 'en-US',
        page: 1,
        timezone: browserTimeZone,
      },
    },
  ] as const satisfies readonly TelevisionSignalDefinition[]

  function hasRequiredArtwork(movie: TmdbMovie): boolean {
    return Boolean(movie.backdrop_path && movie.poster_path)
  }

  function hasTemporalArtwork(movie: TmdbMovie): boolean {
    return Boolean(movie.backdrop_path)
  }

  function hasTelevisionArtwork(
    show: TmdbTvShow,
  ): boolean {
    return Boolean(show.backdrop_path)
  }

  function hasValidReleaseDate(movie: TmdbMovie): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(movie.release_date)
  }

  function isEligibleForTemporalStation(
    movie: TmdbMovie,
    stationId: TemporalStationId,
  ): boolean {
    if (
      !hasTemporalArtwork(movie) ||
      !hasValidReleaseDate(movie)
    ) {
      return false
    }

    if (stationId === 'archive-return') {
      return movie.release_date <= archiveCutoffDate
    }

    if (stationId === 'on-approach') {
      return movie.release_date >= today
    }

    return true
  }

  export function selectFeaturedMovies(
    movies: TmdbMovie[],
    limit = 4,
  ): TmdbMovie[] {
    return movies
      .filter(hasRequiredArtwork)
      .slice(0, limit)
  }

  export function buildDiscoveryCuts(
    resultSets: ReadonlyArray<TmdbMovie[] | undefined>,
    excludedMovieIds: Iterable<number>,
    moviesPerCut = 4,
  ): DiscoveryCut[] {
    const seenMovieIds = new Set(excludedMovieIds)

    return discoveryCutDefinitions.flatMap(
      (definition, definitionIndex) => {
        const selectedMovies: TmdbMovie[] = []
        const candidates = resultSets[definitionIndex] ?? []

        for (const movie of candidates) {
          if (
            selectedMovies.length >= moviesPerCut ||
            seenMovieIds.has(movie.id) ||
            !hasRequiredArtwork(movie)
          ) {
            continue
          }

          seenMovieIds.add(movie.id)
          selectedMovies.push(movie)
        }

        if (selectedMovies.length === 0) {
          return []
        }

        return [
          {
            description: definition.description,
            id: definition.id,
            index: definition.index,
            label: definition.label,
            method: definition.method,
            movies: selectedMovies,
            title: definition.title,
          },
        ]
      },
    )
  }

  export function buildTemporalStations(
    resultSets: ReadonlyArray<TmdbMovie[] | undefined>,
    excludedMovieIds: Iterable<number>,
    moviesPerStation = 3,
  ): TemporalStation[] {
    const seenMovieIds = new Set(excludedMovieIds)

    return temporalStationDefinitions.flatMap(
      (definition, definitionIndex) => {
        const selectedMovies: TmdbMovie[] = []
        const candidates = resultSets[definitionIndex] ?? []

        for (const movie of candidates) {
          if (
            selectedMovies.length >= moviesPerStation ||
            seenMovieIds.has(movie.id) ||
            !isEligibleForTemporalStation(
              movie,
              definition.id,
            )
          ) {
            continue
          }

          seenMovieIds.add(movie.id)
          selectedMovies.push(movie)
        }

        if (selectedMovies.length === 0) {
          return []
        }

        return [
          {
            cue: definition.cue,
            description: definition.description,
            id: definition.id,
            index: definition.index,
            label: definition.label,
            movies: selectedMovies,
            sourceNote: definition.sourceNote,
          },
        ]
      },
    )
  }

  export function buildTelevisionSignals(
    resultSets: ReadonlyArray<TmdbTvShow[] | undefined>,
    showsPerSignal = 5,
  ): TelevisionSignal[] {
    const seenShowIds = new Set<number>()

    return televisionSignalDefinitions.flatMap(
      (definition, definitionIndex) => {
        const selectedShows: TmdbTvShow[] = []
        const candidates = resultSets[definitionIndex] ?? []

        for (const show of candidates) {
          if (
            selectedShows.length >= showsPerSignal ||
            seenShowIds.has(show.id) ||
            !hasTelevisionArtwork(show)
          ) {
            continue
          }

          seenShowIds.add(show.id)
          selectedShows.push(show)
        }

        if (selectedShows.length === 0) {
          return []
        }

        return [
          {
            cue: definition.cue,
            description: definition.description,
            id: definition.id,
            index: definition.index,
            label: definition.label,
            shows: selectedShows,
            sourceNote: definition.sourceNote,
          },
        ]
      },
    )
  }
