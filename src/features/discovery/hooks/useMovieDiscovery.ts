import {
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query'
import {
  getTmdbErrorMessage,
  tmdbFetch,
} from '../../../lib/tmdb/client'
import type {
  TmdbGenreListResponse,
  TmdbMovie,
  TmdbPaginatedResponse,
} from '../../../types/tmdb'
import {
  buildMovieDiscoveryQuery,
  flattenMovieDiscoveryPages,
  getMovieDiscoveryQueryKey,
  getNextMovieDiscoveryPage,
  movieGenreQueryKey,
  type MovieDiscoveryFilters,
} from '../data/movieDiscovery'

export function useMovieDiscovery(
  filters: MovieDiscoveryFilters,
) {
  const genresQuery = useQuery({
    queryKey: movieGenreQueryKey,
    queryFn: ({ signal }) =>
      tmdbFetch<TmdbGenreListResponse>(
        '/genre/movie/list',
        {
          query: {
            language: 'en-US',
          },
          signal,
        },
      ),
    select: (response) =>
      [...response.genres].sort((first, second) =>
        first.name.localeCompare(second.name),
      ),
  })

  const moviesQuery = useInfiniteQuery({
    queryKey: getMovieDiscoveryQueryKey(filters),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      tmdbFetch<TmdbPaginatedResponse<TmdbMovie>>(
        '/discover/movie',
        {
          query: buildMovieDiscoveryQuery(
            filters,
            pageParam,
          ),
          signal,
        },
      ),
    getNextPageParam: getNextMovieDiscoveryPage,
  })

  const records = flattenMovieDiscoveryPages(
    moviesQuery.data?.pages,
  )

  const firstPage = moviesQuery.data?.pages[0]
  const loadedPageCount =
    moviesQuery.data?.pages.length ?? 0

  function retryGenres(): void {
    void genresQuery.refetch()
  }

  function retryMovies(): void {
    void moviesQuery.refetch()
  }

  function loadNextPage(): void {
    if (
      moviesQuery.hasNextPage &&
      !moviesQuery.isFetchingNextPage
    ) {
      void moviesQuery.fetchNextPage()
    }
  }

  return {
    genres: {
      errorMessage: genresQuery.error
        ? getTmdbErrorMessage(genresQuery.error)
        : null,
      isEmpty:
        genresQuery.isSuccess &&
        genresQuery.data.length === 0,
      isError: genresQuery.isError,
      isPending: genresQuery.isPending,
      items: genresQuery.data ?? [],
      retry: retryGenres,
    },
    movies: {
      errorMessage: moviesQuery.error
        ? getTmdbErrorMessage(moviesQuery.error)
        : null,
      hasNextPage: moviesQuery.hasNextPage,
      isEmpty:
        moviesQuery.isSuccess &&
        records.length === 0,
      isError: moviesQuery.isError,
      isFetchingNextPage:
        moviesQuery.isFetchingNextPage,
      isNextPageError:
        moviesQuery.isFetchNextPageError,
      isPending: moviesQuery.isPending,
      loadNextPage,
      loadedPageCount,
      records,
      retry: retryMovies,
      totalPages: firstPage?.total_pages ?? 0,
      totalResults: firstPage?.total_results ?? 0,
    },
  }
}
