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
  TmdbPaginatedResponse,
  TmdbTvShow,
} from '../../../types/tmdb'

import {
  flattenTvDiscoveryPages,
  getNextTvDiscoveryPage,
  getTvDiscoveryPath,
  getTvDiscoveryQueryKey,
  tvGenreQueryKey,
  type TvDiscoveryView,
} from '../data/tvDiscovery'

export function useTvDiscovery(
  view: TvDiscoveryView,
) {
  const genresQuery = useQuery({
    queryKey: tvGenreQueryKey,
    queryFn: ({ signal }) =>
      tmdbFetch<TmdbGenreListResponse>(
        '/genre/tv/list',
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

  const showsQuery = useInfiniteQuery({
    queryKey: getTvDiscoveryQueryKey(view),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      tmdbFetch<
        TmdbPaginatedResponse<TmdbTvShow>
      >(getTvDiscoveryPath(view), {
        query: {
          language: 'en-US',
          page: pageParam,
        },
        signal,
      }),
    getNextPageParam: getNextTvDiscoveryPage,
  })

  const records = flattenTvDiscoveryPages(
    showsQuery.data?.pages,
  )
  const firstPage = showsQuery.data?.pages[0]

  function retryGenres(): void {
    void genresQuery.refetch()
  }

  function retryShows(): void {
    void showsQuery.refetch()
  }

  function loadNextPage(): void {
    if (
      showsQuery.hasNextPage &&
      !showsQuery.isFetchingNextPage
    ) {
      void showsQuery.fetchNextPage()
    }
  }

  return {
    genres: {
      errorMessage: genresQuery.error
        ? getTmdbErrorMessage(genresQuery.error)
        : null,
      isError: genresQuery.isError,
      isPending: genresQuery.isPending,
      items: genresQuery.data ?? [],
      retry: retryGenres,
    },
    shows: {
      errorMessage: showsQuery.error
        ? getTmdbErrorMessage(showsQuery.error)
        : null,
      hasNextPage: Boolean(
        showsQuery.hasNextPage,
      ),
      isEmpty:
        showsQuery.isSuccess &&
        records.length === 0,
      isFetchingNextPage:
        showsQuery.isFetchingNextPage,
      isInitialError:
        showsQuery.isError &&
        records.length === 0,
      isNextPageError:
        showsQuery.isFetchNextPageError,
      isPending: showsQuery.isPending,
      loadNextPage,
      loadedPageCount:
        showsQuery.data?.pages.length ?? 0,
      records,
      retry: retryShows,
      totalResults:
        firstPage?.total_results ?? 0,
    },
  }
}
