import type { TmdbMovie } from '../../../types/tmdb'

export type DiscoveryCutId =
  | 'quiet-and-strange'
  | 'high-tension'
  | 'stories-under-two-hours'

type DiscoveryQuery = Record<
  string,
  string | number | boolean
>

export type DiscoveryCutDefinition = {
  description: string
  id: DiscoveryCutId
  index: string
  label: string
  method: string
  query: DiscoveryQuery
  title: string
}

export type DiscoveryCut = Omit<
  DiscoveryCutDefinition,
  'query'
> & {
  movies: TmdbMovie[]
}

export const homeFeaturedQueryKey = [
  'tmdb',
  'home',
  'featured-movies',
] as const

function getLocalDate(): string {
  const today = new Date()

  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const today = getLocalDate()

export const discoveryCutDefinitions = [
  {
    id: 'quiet-and-strange',
    index: '01',
    label: 'Quiet and strange',
    title: 'Stories that leave space for the unexplained.',
    description:
      'Measured films with dramatic, mysterious, or speculative signals—selected for atmosphere rather than spectacle.',
    method:
      'Drama, mystery, and science-fiction signals with established audience activity. Action and war titles are filtered out where possible.',
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
      'Thrillers, mysteries, and crime stories carrying a strong current audience signal without becoming a generic action list.',
    method:
      'Thriller, crime, and mystery signals ordered by current TMDB popularity with a meaningful vote-count threshold.',
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
      'Released feature-length stories running between 75 and 120 minutes, with enough audience response to avoid presenting random catalogue entries.',
    method:
      'Released on or before today, runtime between 75 and 120 minutes, with popularity, rating, and vote-count filters. This is an editorial utility cut, not a personalized recommendation.',
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

function hasRequiredArtwork(movie: TmdbMovie): boolean {
  return Boolean(movie.backdrop_path && movie.poster_path)
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