import { useQuery } from '@tanstack/react-query'
import {
  CheckCircle2,
  Film,
  ImageOff,
  Star,
} from 'lucide-react'

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../components/feedback'
import {
  getTmdbErrorMessage,
  tmdbFetch,
} from '../../../lib/tmdb/client'
import { getTmdbPosterUrl } from '../../../lib/tmdb/image'
import type {
  TmdbMovie,
  TmdbPaginatedResponse,
} from '../../../types/tmdb'

const verificationQueryKey = [
  'tmdb',
  'verification',
  'popular-movies',
] as const

function getReleaseYear(releaseDate: string): string {
  return releaseDate ? releaseDate.slice(0, 4) : 'Unknown year'
}

export function TmdbVerificationPage() {
  const {
    data,
    error,
    isError,
    isFetching,
    isPending,
    refetch,
  } = useQuery({
    queryKey: verificationQueryKey,
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
      <LoadingState
        message="CineScope is requesting popular movies from TMDB."
        title="Verifying TMDB connection"
      />
    )
  }

  if (isError) {
    return (
      <ErrorState
        message={getTmdbErrorMessage(error)}
        onRetry={() => {
          void refetch()
        }}
        title="TMDB connection failed"
      />
    )
  }

  const movies = data?.results ?? []

  if (movies.length === 0) {
    return (
      <EmptyState
        message="TMDB responded successfully, but no popular movies were returned."
        onAction={() => {
          void refetch()
        }}
        actionLabel="Check again"
        title="No movies returned"
      />
    )
  }

  return (
    <div className="space-y-8">
      <header className="space-y-5">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-4 py-2 text-sm font-medium text-[var(--color-app-muted)]">
          <Film
            aria-hidden="true"
            className="size-4 text-[var(--color-app-primary)]"
          />
          Development verification
        </span>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-app-text)] sm:text-4xl">
            TMDB data foundation
          </h1>

          <p className="max-w-2xl text-sm leading-7 text-[var(--color-app-muted)] sm:text-base">
            This temporary page confirms that environment configuration,
            Bearer authentication, the typed TMDB client, TanStack Query,
            shared models, image utilities, and reusable feedback states
            are working together.
          </p>
        </div>

        <div
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-app-primary-soft)] px-4 py-3 text-sm font-semibold text-[var(--color-app-primary)]"
          role="status"
        >
          <CheckCircle2 aria-hidden="true" className="size-5" />
          TMDB API connection verified
        </div>
      </header>

      <section
        aria-labelledby="verification-results-heading"
        className="space-y-4"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              className="text-xl font-semibold text-[var(--color-app-text)]"
              id="verification-results-heading"
            >
              Popular movie response
            </h2>

            <p className="mt-1 text-sm text-[var(--color-app-muted)]">
              Showing the first six movies returned by TMDB.
            </p>
          </div>

          {isFetching ? (
            <span
              aria-live="polite"
              className="text-sm text-[var(--color-app-muted)]"
            >
              Refreshing data…
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {movies.slice(0, 6).map((movie) => {
            const posterUrl = getTmdbPosterUrl(movie.poster_path)

            return (
              <article
                className="overflow-hidden rounded-2xl border border-[var(--color-app-border)] bg-[var(--color-app-surface)] shadow-[var(--shadow-app-elevated)]"
                key={movie.id}
              >
                <div className="aspect-[2/3] overflow-hidden bg-[var(--color-app-surface-elevated)]">
                  {posterUrl ? (
                    <img
                      alt={`${movie.title} poster`}
                      className="h-full w-full object-cover"
                      height="750"
                      loading="lazy"
                      src={posterUrl}
                      width="500"
                    />
                  ) : (
                    <div
                      aria-label={`No poster available for ${movie.title}`}
                      className="grid h-full place-items-center text-[var(--color-app-subtle)]"
                      role="img"
                    >
                      <ImageOff
                        aria-hidden="true"
                        className="size-9"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3 p-4">
                  <div className="space-y-1">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-[var(--color-app-text)]">
                      {movie.title}
                    </h3>

                    <p className="text-xs text-[var(--color-app-muted)]">
                      {getReleaseYear(movie.release_date)}
                    </p>
                  </div>

                  <p
                    aria-label={`TMDB rating ${movie.vote_average.toFixed(1)} out of 10`}
                    className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-app-rating)]"
                  >
                    <Star
                      aria-hidden="true"
                      className="size-4 fill-current"
                    />
                    {movie.vote_average.toFixed(1)}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
