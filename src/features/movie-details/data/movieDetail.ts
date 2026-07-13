export const MOVIE_DETAIL_APPEND_TO_RESPONSE =
  'credits,videos,recommendations'

export function parseMovieId(
  routeMovieId: string | undefined,
): number | null {
  if (!routeMovieId || !/^\d+$/.test(routeMovieId)) {
    return null
  }

  const movieId = Number(routeMovieId)

  if (!Number.isSafeInteger(movieId) || movieId <= 0) {
    return null
  }

  return movieId
}

export function getMovieDetailQueryKey(
  movieId: number | null,
) {
  return [
    'tmdb',
    'movie',
    movieId,
    'details',
    'en-US',
  ] as const
}

export function getMovieWatchProvidersQueryKey(
  movieId: number | null,
) {
  return [
    'tmdb',
    'movie',
    movieId,
    'watch-providers',
  ] as const
}