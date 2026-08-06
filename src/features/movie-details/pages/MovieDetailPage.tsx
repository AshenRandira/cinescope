import { useEffect } from 'react'
import { Link, useParams } from 'react-router'

import {
  ErrorState,
  LoadingState,
} from '../../../components/feedback'

import {
  getTmdbBackdropUrl,
  getTmdbImageSrcSet,
  getTmdbPosterUrl,
} from '../../../lib/tmdb/image'

import { LibraryControls } from '../../library/components/LibraryControls'

import { parseMovieId } from '../data/movieDetail'
import { useMovieDetail } from '../hooks/useMovieDetail'

import './MovieDetailPage.css'

import { MovieAvailabilitySection } from '../components/MovieAvailabilitySection'
import { MovieDetailSections } from '../components/MovieDetailSections'
import { MovieRecommendationsSection } from '../components/MovieRecommendationsSection'
import { MovieVideoSection } from '../components/MovieVideoSection'

function formatReleaseDate(
  releaseDate: string,
): string {
  if (!releaseDate) {
    return 'Release date unavailable'
  }

  const date = new Date(`${releaseDate}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return releaseDate
  }

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatRuntime(
  runtime: number | null,
): string {
  if (
    runtime === null ||
    !Number.isFinite(runtime) ||
    runtime <= 0
  ) {
    return 'Runtime unavailable'
  }

  const hours = Math.floor(runtime / 60)
  const minutes = runtime % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  if (minutes === 0) {
    return `${hours} hr`
  }

  return `${hours} hr ${minutes} min`
}

function formatVoteCount(
  voteCount: number,
): string {
  if (voteCount === 1) {
    return '1 recorded vote'
  }

  return `${voteCount.toLocaleString()} recorded votes`
}

function MovieDetailRouteState({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section className="movie-detail-state">
      <div className="movie-detail-state__panel">
        {children}
      </div>
    </section>
  )
}

export function MovieDetailPage() {
  const { movieId: routeMovieId } = useParams<{
    movieId: string
  }>()

  const movieId = parseMovieId(routeMovieId)
  const { details, watchProviders } = useMovieDetail(movieId)

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'auto',
    })
  }, [movieId])

  useEffect(() => {
    if (details.data) {
      document.title =
        `${details.data.title} — CineScope`
      return
    }

    document.title = 'Movie Record — CineScope'
  }, [details.data])

  if (movieId === null) {
    return (
      <MovieDetailRouteState>
        <p className="archive-label">
          Record exception
        </p>

        <h1 className="movie-detail-state__title font-display">
          Invalid movie record.
        </h1>

        <p className="movie-detail-state__message">
          The requested route does not contain a valid
          TMDB movie identifier.
        </p>

        <Link
          className="movie-detail-state__link"
          to="/movies"
        >
          Return to the movie register
          <span aria-hidden="true"> →</span>
        </Link>
      </MovieDetailRouteState>
    )
  }

  if (details.isPending) {
    return (
      <MovieDetailRouteState>
        <LoadingState
          title="Preparing the feature record"
          message="Retrieving the movie, credits, videos, and related catalogue material."
        />
      </MovieDetailRouteState>
    )
  }

  if (details.isMissing) {
    return (
      <MovieDetailRouteState>
        <p className="archive-label">
          Missing record
        </p>

        <h1 className="movie-detail-state__title font-display">
          This film could not be found.
        </h1>

        <p className="movie-detail-state__message">
          TMDB does not currently contain a movie record
          for identifier {movieId}.
        </p>

        <Link
          className="movie-detail-state__link"
          to="/movies"
        >
          Return to the movie register
          <span aria-hidden="true"> →</span>
        </Link>
      </MovieDetailRouteState>
    )
  }

  if (details.isError) {
    return (
      <MovieDetailRouteState>
        <ErrorState
          title="The feature record could not be projected"
          message={
            details.errorMessage ??
            'The movie record is temporarily unavailable.'
          }
          onRetry={details.retry}
          retryLabel="Retry movie record"
        />
      </MovieDetailRouteState>
    )
  }

  const movie = details.data

  if (!movie) {
    return (
      <MovieDetailRouteState>
        <p className="archive-label">
          Record unavailable
        </p>

        <h1 className="movie-detail-state__title font-display">
          No feature record was returned.
        </h1>

        <p className="movie-detail-state__message">
          Return to the register and select another film.
        </p>

        <Link
          className="movie-detail-state__link"
          to="/movies"
        >
          Return to the movie register
          <span aria-hidden="true"> →</span>
        </Link>
      </MovieDetailRouteState>
    )
  }

  const backdropUrl = getTmdbBackdropUrl(
    movie.backdrop_path,
    'original',
  )

  const posterUrl = getTmdbPosterUrl(
    movie.poster_path,
    'w780',
  )

  const heroImageUrl = backdropUrl ?? posterUrl
  const heroUsesBackdrop = backdropUrl !== null

  const heroImageSrcSet = heroUsesBackdrop
    ? getTmdbImageSrcSet(
        movie.backdrop_path,
        ['w780', 'w1280'],
      )
    : getTmdbImageSrcSet(
        movie.poster_path,
        ['w500', 'w780'],
      )

  const posterSrcSet = getTmdbImageSrcSet(
    movie.poster_path,
    ['w342', 'w500', 'w780'],
  )

  const releaseYear = movie.release_date
    ? movie.release_date.slice(0, 4)
    : 'Date unavailable'

  const genreLabel =
    movie.genres.length > 0
      ? movie.genres
          .map((genre) => genre.name)
          .join(' / ')
      : 'Genre unavailable'

  const scoreLabel =
    movie.vote_count > 0
      ? movie.vote_average.toFixed(1)
      : '—'

  return (
    <article className="movie-detail-page">
      <section
        className={[
          'movie-detail-hero',
          heroImageUrl
            ? ''
            : 'movie-detail-hero--without-artwork',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-labelledby="movie-detail-title"
      >
        <div
          className="movie-detail-hero__artwork"
          aria-hidden="true"
        >
          {heroImageUrl ? (
            <img
              alt=""
              decoding="async"
              fetchPriority="high"
              loading="eager"
              sizes="100vw"
              src={heroImageUrl}
              srcSet={heroImageSrcSet}
            />
          ) : (
            <div className="movie-detail-hero__fallback">
              <span>Backdrop unavailable</span>
            </div>
          )}
        </div>

        <div className="movie-detail-hero__shade" />

        <div className="movie-detail-hero__inner">
          <Link
            className="movie-detail-hero__return"
            to="/movies"
          >
            <span aria-hidden="true">←</span>
            Movie register
          </Link>

          <div className="movie-detail-hero__layout">
            <div className="movie-detail-hero__copy">
              <p className="archive-label">
                Feature record / TMDB {movie.id}
              </p>

              <h1
                className="movie-detail-hero__title font-display text-balance"
                id="movie-detail-title"
              >
                {movie.title}
              </h1>

              {movie.tagline ? (
                <p className="movie-detail-hero__tagline text-pretty">
                  {movie.tagline}
                </p>
              ) : null}

              <ul
                className="movie-detail-hero__index"
                aria-label="Movie summary"
              >
                <li>{releaseYear}</li>
                <li>{formatRuntime(movie.runtime)}</li>
                <li>{movie.status}</li>
              </ul>

              <p className="movie-detail-hero__genres">
                {genreLabel}
              </p>

              <p className="movie-detail-hero__overview text-pretty">
                {movie.overview ||
                  'This feature record does not yet include an overview.'}
              </p>

              <LibraryControls
                candidate={{
                  backdropPath: movie.backdrop_path,
                  id: movie.id,
                  mediaType: 'movie',
                  overview: movie.overview || null,
                  posterPath: movie.poster_path,
                  releaseYear:
                    movie.release_date
                      ? movie.release_date.slice(0, 4)
                      : null,
                  title: movie.title,
                }}
              />

              <dl className="movie-detail-hero__ratings">
                <div>
                  <dt>TMDB user score</dt>
                  <dd>
                    {scoreLabel}
                    {movie.vote_count > 0 ? (
                      <span> / 10</span>
                    ) : null}
                  </dd>
                </div>

                <div>
                  <dt>Audience volume</dt>
                  <dd>
                    {formatVoteCount(movie.vote_count)}
                  </dd>
                </div>

                <div>
                  <dt>Primary release</dt>
                  <dd>
                    {formatReleaseDate(
                      movie.release_date,
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            <aside
              className="movie-detail-hero__poster-frame"
              aria-label={`${movie.title} poster`}
            >
              {posterUrl ? (
                <img
                  alt={`${movie.title} poster`}
                  decoding="async"
                  loading="eager"
                  sizes="(max-width: 48rem) 46vw, 24vw"
                  src={posterUrl}
                  srcSet={posterSrcSet}
                />
              ) : (
                <div className="movie-detail-hero__poster-fallback">
                  <span>Poster unavailable</span>
                </div>
              )}

              <span className="movie-detail-hero__record-number">
                CS / {movie.id}
              </span>
            </aside>
          </div>
        </div>
      </section>

      <MovieVideoSection movie={movie} />

      <MovieDetailSections movie={movie} />

      <MovieAvailabilitySection
        movieTitle={movie.title}
        watchProviders={watchProviders}
      />

      <MovieRecommendationsSection
        movie={movie}
      />
    </article>
  )
}
