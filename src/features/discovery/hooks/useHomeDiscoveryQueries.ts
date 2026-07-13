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
  buildTemporalStations,
  discoveryCutDefinitions,
  homeFeaturedQueryKey,
  selectFeaturedMovies,
  temporalStationDefinitions,
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

  const discoveryMovieIds = discoveryCuts.flatMap(
    (cut) => cut.movies.map((movie) => movie.id),
  )

  const temporalQueries = useQueries({
    queries: temporalStationDefinitions.map(
      (definition) => ({
        queryKey: [
          'tmdb',
          'home',
          'temporal-cinema-map',
          definition.id,
          definition.endpoint,
          definition.query,
        ] as const,
        queryFn: ({ signal }) =>
          tmdbFetch<TmdbPaginatedResponse<TmdbMovie>>(
            definition.endpoint,
            {
              query: definition.query,
              signal,
            },
          ),
        select: (
          response: TmdbPaginatedResponse<TmdbMovie>,
        ) => response.results,
      }),
    ),
  })

  const temporalStations = buildTemporalStations(
    temporalQueries.map((query) => query.data),
    [
      ...featuredMovieIds,
      ...discoveryMovieIds,
    ],
  )

  const hasDiscoveryContent = discoveryCuts.length > 0
  const hasTemporalContent = temporalStations.length > 0

  const discoveryError = discoveryQueries.find(
    (query) => query.error,
  )?.error

  const temporalError = temporalQueries.find(
    (query) => query.error,
  )?.error

  const isTemporalPending =
    !hasTemporalContent &&
    temporalQueries.some((query) => query.isPending)

  const isTemporalError =
    !hasTemporalContent &&
    !isTemporalPending &&
    temporalQueries.some((query) => query.isError)

  function refetchFeatured(): void {
    void featuredQuery.refetch()
  }

  function refetchDiscovery(): void {
    discoveryQueries.forEach((query) => {
      void query.refetch()
    })
  }

  function refetchTemporal(): void {
    temporalQueries.forEach((query) => {
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
        discoveryQueries.every(
          (query) => query.isError,
        ),
      isPending:
        !hasDiscoveryContent &&
        discoveryQueries.some(
          (query) => query.isPending,
        ),
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
    temporal: {
      error: temporalError,
      isEmpty:
        !hasTemporalContent &&
        temporalQueries.every(
          (query) => !query.isPending && !query.isError,
        ),
      isError: isTemporalError,
      isPending: isTemporalPending,
      refetch: refetchTemporal,
      stations: temporalStations,
    },
  }
}