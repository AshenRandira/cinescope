import { useQuery } from '@tanstack/react-query'

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../components/feedback'
import {
  getTmdbErrorMessage,
  tmdbFetch,
} from '../../../lib/tmdb/client'
import type {
  TmdbMovie,
  TmdbPaginatedResponse,
} from '../../../types/tmdb'
import { ArchiveProjectionHero } from '../components/ArchiveProjectionHero'

const homeFeaturedQueryKey = [
  'tmdb',
  'home',
  'featured-movies',
] as const

export function HomePage() {
  const {
    data,
    error,
    isError,
    isPending,
    refetch,
  } = useQuery({
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
  })

  if (isPending) {
    return (
      <div className="mx-auto max-w-[var(--layout-max)] py-16">
        <LoadingState
          message="Preparing the opening projection from the CineScope archive."
          title="Opening CineScope"
        />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-[var(--layout-max)] py-16">
        <ErrorState
          message={getTmdbErrorMessage(error)}
          onRetry={() => {
            void refetch()
          }}
          title="The opening projection could not be loaded"
        />
      </div>
    )
  }

  const featuredMovies = (data?.results ?? [])
    .filter(
      (movie) =>
        Boolean(movie.backdrop_path) &&
        Boolean(movie.poster_path),
    )
    .slice(0, 4)

  if (featuredMovies.length === 0) {
    return (
      <div className="mx-auto max-w-[var(--layout-max)] py-16">
        <EmptyState
          actionLabel="Request another projection"
          message="TMDB responded successfully, but no suitable featured artwork was available."
          onAction={() => {
            void refetch()
          }}
          title="No featured stories available"
        />
      </div>
    )
  }

  return (
    <ArchiveProjectionHero movies={featuredMovies} />
  )
}