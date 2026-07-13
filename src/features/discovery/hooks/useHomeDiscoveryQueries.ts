import {
    useQueries,
    useQuery,
  } from '@tanstack/react-query'
  
  import { tmdbFetch } from '../../../lib/tmdb/client'
  import type {
    TmdbMovie,
    TmdbPaginatedResponse,
  } from '../../../types/tmdb'
  import {
    buildDiscoveryCuts,
    discoveryCutDefinitions,
    homeFeaturedQueryKey,
    selectFeaturedMovies,
  } from '../data/homeDiscovery'
  
  export function useHomeDiscoveryQueries() {
    const featuredQuery = useQuery({
      queryKey: homeFeaturedQueryKey,
      queryFn: ({ signal }) =>
        tmdbFetch<TmdbPaginatedResponse<TmdbMovie>>(
          '/movie/popular',
          {
            query: {
              language: 'en-US',
              page: 1,
            },
            signal,
          },
        ),
      select: (response) =>
        selectFeaturedMovies(response.results),
    })
  
    const discoveryQueries = useQueries({
      queries: discoveryCutDefinitions.map((definition) => ({
        queryKey: [
          'tmdb',
          'home',
          'discovery-splice',
          definition.id,
          definition.query,
        ] as const,
        queryFn: ({ signal }) =>
          tmdbFetch<TmdbPaginatedResponse<TmdbMovie>>(
            '/discover/movie',
            {
              query: definition.query,
              signal,
            },
          ),
        select: (
          response: TmdbPaginatedResponse<TmdbMovie>,
        ) => response.results,
      })),
    })
  
    const featuredMovies = featuredQuery.data ?? []
    const featuredMovieIds = featuredMovies.map(
      (movie) => movie.id,
    )
  
    const discoveryCuts = buildDiscoveryCuts(
      discoveryQueries.map((query) => query.data),
      featuredMovieIds,
    )
  
    const hasDiscoveryContent = discoveryCuts.length > 0
  
    const discoveryError = discoveryQueries.find(
      (query) => query.error,
    )?.error
  
    function refetchFeatured(): void {
      void featuredQuery.refetch()
    }
  
    function refetchDiscovery(): void {
      discoveryQueries.forEach((query) => {
        void query.refetch()
      })
    }
  
    return {
      discovery: {
        cuts: discoveryCuts,
        error: discoveryError,
        isEmpty:
          !hasDiscoveryContent &&
          discoveryQueries.every(
            (query) => !query.isPending && !query.isError,
          ),
        isError:
          !hasDiscoveryContent &&
          discoveryQueries.every((query) => query.isError),
        isPending:
          !hasDiscoveryContent &&
          discoveryQueries.some((query) => query.isPending),
        refetch: refetchDiscovery,
      },
      featured: {
        error: featuredQuery.error,
        isEmpty:
          !featuredQuery.isPending &&
          !featuredQuery.isError &&
          featuredMovies.length === 0,
        isError: featuredQuery.isError,
        isPending: featuredQuery.isPending,
        movies: featuredMovies,
        refetch: refetchFeatured,
      },
    }
  }