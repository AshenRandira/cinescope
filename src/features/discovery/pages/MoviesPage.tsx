import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../components/feedback'
import {
  getTmdbBackdropUrl,
  getTmdbImageSrcSet,
  getTmdbPosterUrl,
} from '../../../lib/tmdb/image'
import {
  type MovieDiscoveryRecord,
} from '../data/movieDiscovery'
import {
  getMovieDiscoveryMethodLabel,
} from '../data/movieDiscoveryUrl'
import {
  MovieDiscoveryControls,
} from '../components/MovieDiscoveryControls'
import {
  MovieDiscoveryContinuation,
} from '../components/MovieDiscoveryContinuation'
import { useMovieDiscovery } from '../hooks/useMovieDiscovery'
import {
  useMovieDiscoveryFilters,
} from '../hooks/useMovieDiscoveryFilters'
import './MoviesPage.css'

type GenreLookup = ReadonlyMap<number, string>

type MovieRecordProps = {
  genreNames: GenreLookup
  record: MovieDiscoveryRecord
}

type ContactSheetRecordProps = MovieRecordProps & {
  index: number
  isSelected: boolean
  onToggle: (movieId: number) => void
}

function formatVoteCount(voteCount: number): string {
  if (voteCount === 1) {
    return '1 recorded vote'
  }

  return `${voteCount.toLocaleString()} recorded votes`
}

function getScoreLabel(
  voteAverage: number | null,
): string {
  if (voteAverage === null) {
    return 'Not yet rated'
  }

  return `${voteAverage.toFixed(1)} TMDB user score`
}

function resolveGenres(
  genreIds: number[],
  genreNames: GenreLookup,
  limit = 3,
): string[] {
  return genreIds
    .map((genreId) => genreNames.get(genreId))
    .filter((genreName): genreName is string =>
      Boolean(genreName),
    )
    .slice(0, limit)
}

function getGenreLabel(
  record: MovieDiscoveryRecord,
  genreNames: GenreLookup,
  limit = 3,
): string {
  const resolvedGenres = resolveGenres(
    record.genreIds,
    genreNames,
    limit,
  )

  if (resolvedGenres.length === 0) {
    return 'Genre unavailable'
  }

  return resolvedGenres.join(' / ')
}

function OpeningProjection({
  genreNames,
  record,
}: MovieRecordProps) {
  const backdropUrl = getTmdbBackdropUrl(
    record.backdropPath,
    'w1280',
  )

  const posterUrl = getTmdbPosterUrl(
    record.posterPath,
    'w500',
  )

  const useBackdrop = backdropUrl !== null
  const imageUrl = backdropUrl ?? posterUrl

  const imageSrcSet = useBackdrop
    ? getTmdbImageSrcSet(
        record.backdropPath,
        ['w780', 'w1280'],
      )
    : getTmdbImageSrcSet(
        record.posterPath,
        ['w342', 'w500', 'w780'],
      )

  return (
    <article
      className="movie-opening-projection"
      aria-labelledby={`opening-movie-${record.id}`}
    >
      <div
        className={[
          'movie-opening-projection__artwork',
          useBackdrop
            ? 'movie-opening-projection__artwork--landscape'
            : 'movie-opening-projection__artwork--portrait',
        ].join(' ')}
      >
        {imageUrl ? (
          <img
            alt={
              useBackdrop
                ? `${record.title} backdrop artwork`
                : `${record.title} poster`
            }
            decoding="async"
            fetchPriority="high"
            loading="eager"
            sizes="(max-width: 48rem) 100vw, 53vw"
            src={imageUrl}
            srcSet={imageSrcSet}
          />
        ) : (
          <div
            className="movie-artwork-fallback"
            aria-hidden="true"
          >
            <span>Artwork unavailable</span>
          </div>
        )}

      </div>

      <div className="movie-opening-projection__copy">
        <p className="archive-label">
          Featured result
        </p>

        <h3
          className="movie-opening-projection__title font-display"
          id={`opening-movie-${record.id}`}
        >
          {record.title}
        </h3>

        <p className="movie-record-index">
          <span>
            {record.releaseYear ??
              'Release date unavailable'}
          </span>
          <span aria-hidden="true">/</span>
          <span>
            {getGenreLabel(
              record,
              genreNames,
            )}
          </span>
          <span aria-hidden="true">/</span>
          <span>
            {record.originalLanguage.toUpperCase()}
          </span>
        </p>

        <p className="movie-opening-projection__overview text-pretty">
          {record.overview ??
            'This archive record does not yet include a synopsis.'}
        </p>

        <dl className="movie-record-signals">
          <div>
            <dt>Audience response</dt>
            <dd>
              {getScoreLabel(record.voteAverage)}
            </dd>
          </div>

          <div>
            <dt>Rating volume</dt>
            <dd>{formatVoteCount(record.voteCount)}</dd>
          </div>
        </dl>

        <Link
          className="movie-opening-projection__record-link"
          to={`/movies/${record.id}`}
        >
          View movie details
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </article>
  )
}

function ContactSheetRecord({
  genreNames,
  index,
  isSelected,
  onToggle,
  record,
}: ContactSheetRecordProps) {
  const isWideCandidate =
    index % 7 === 1 ||
    index % 7 === 5

  const isWide =
    record.backdropPath !== null &&
    isWideCandidate

  const useBackdrop = isWide

  const imageUrl = useBackdrop
    ? getTmdbBackdropUrl(
        record.backdropPath,
        'w780',
      )
    : getTmdbPosterUrl(
        record.posterPath,
        'w500',
      )

  const imageSrcSet = useBackdrop
    ? getTmdbImageSrcSet(
        record.backdropPath,
        ['w300', 'w780'],
      )
    : getTmdbImageSrcSet(
        record.posterPath,
        ['w185', 'w342', 'w500'],
      )

  const titleId = `contact-movie-${record.id}`
  const inspectionId =
    `movie-inspection-${record.id}`

  const variantClass = isWide
    ? 'movie-contact-card--wide'
    : 'movie-contact-card--standard'

  return (
    <article
      className={[
        'movie-contact-card',
        variantClass,
        isSelected
          ? 'movie-contact-card--selected'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={titleId}
    >
      <div className="movie-contact-card__shell">
        <div
          className={[
            'movie-contact-card__artwork',
            useBackdrop
              ? 'movie-contact-card__artwork--landscape'
              : 'movie-contact-card__artwork--portrait',
          ].join(' ')}
        >
          {imageUrl ? (
            <img
              alt={`${record.title} ${
                useBackdrop
                  ? 'backdrop artwork'
                  : 'poster'
              }`}
              decoding="async"
              loading="lazy"
              sizes={
                useBackdrop
                  ? '(max-width: 48rem) 100vw, 42vw'
                  : '(max-width: 40rem) 45vw, 22vw'
              }
              src={imageUrl}
              srcSet={imageSrcSet}
            />
          ) : (
            <div
              className="movie-artwork-fallback"
              aria-hidden="true"
            >
              <span>Artwork unavailable</span>
            </div>
          )}

          <div className="movie-contact-card__dossier">
            <div className="movie-contact-card__dossier-header">
              <p className="archive-label">
                Movie summary
              </p>

            </div>

            <p className="movie-contact-card__dossier-overview">
              {record.overview ??
                'Synopsis unavailable for this record.'}
            </p>

            <dl className="movie-contact-card__dossier-signals">
              <div>
                <dt>TMDB score</dt>
                <dd>
                  {record.voteAverage === null
                    ? 'Not rated'
                    : record.voteAverage.toFixed(1)}
                </dd>
              </div>

              <div>
                <dt>Recorded votes</dt>
                <dd>
                  {record.voteCount.toLocaleString()}
                </dd>
              </div>
            </dl>

            <button
              className="movie-contact-card__dossier-action"
              type="button"
              aria-controls={inspectionId}
              aria-expanded={isSelected}
              onClick={() => onToggle(record.id)}
            >
              {isSelected
                ? 'Hide summary'
                : 'Show summary'}
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        </div>

        <div className="movie-contact-card__caption">
          <h3
            className="movie-contact-card__title font-display"
            id={titleId}
          >
            {record.title}
          </h3>

          <p className="movie-contact-card__index">
            <span>
              {record.releaseYear ?? 'Date unknown'}
            </span>
            <span aria-hidden="true">/</span>
            <span>
              {getGenreLabel(
                record,
                genreNames,
                isWide ? 3 : 2,
              )}
            </span>
          </p>

          <div className="movie-contact-card__actions">
            <Link
              className="movie-contact-card__record-link"
              to={`/movies/${record.id}`}
            >
              View movie details
              <span aria-hidden="true">&rarr;</span>
            </Link>

            <button
              className="movie-contact-card__mobile-action"
              type="button"
              aria-controls={inspectionId}
              aria-expanded={isSelected}
              onClick={() => onToggle(record.id)}
            >
              {isSelected
                ? 'Hide summary'
                : 'Show summary'}
            </button>
          </div>
        </div>
      </div>

      {isSelected ? (
        <div
          className="movie-contact-card__inspection"
          id={inspectionId}
          role="region"
          aria-label={`Expanded details for ${record.title}`}
        >
          <div>
            <p className="archive-label">
              Movie summary
            </p>

            <p className="movie-contact-card__inspection-overview text-pretty">
              {record.overview ??
                'This archive record does not yet include a synopsis.'}
            </p>
          </div>

          <dl className="movie-record-signals">
            <div>
              <dt>Primary release</dt>
              <dd>
                {record.releaseDate ??
                  'Release date unavailable'}
              </dd>
            </div>

            <div>
              <dt>Genres</dt>
              <dd>
                {getGenreLabel(
                  record,
                  genreNames,
                )}
              </dd>
            </div>

            <div>
              <dt>TMDB audience response</dt>
              <dd>
                {getScoreLabel(
                  record.voteAverage,
                )}
              </dd>
            </div>

            <div>
              <dt>Rating volume</dt>
              <dd>
                {formatVoteCount(
                  record.voteCount,
                )}
              </dd>
            </div>

            <div>
              <dt>Original language</dt>
              <dd>
                {record.originalLanguage.toUpperCase()}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </article>
  )
}

export function MoviesPage() {
  const [selectedMovieId, setSelectedMovieId] =
    useState<number | null>(null)

  const {
    filters,
    isDefault,
    resetFilters,
    setGenreId,
    setMinimumScore,
    setReleasePeriod,
    setRuntime,
    setSort,
  } = useMovieDiscoveryFilters()

  const { genres, movies } =
    useMovieDiscovery(filters)

  const genreNames = useMemo(
    () =>
      new Map<number, string>(
        genres.items.map((genre) => [
          genre.id,
          genre.name,
        ]),
      ),
    [genres.items],
  )

  const activeGenreName =
    filters.genreId === null
      ? null
      : genreNames.get(filters.genreId) ?? null

  const methodLabel =
    getMovieDiscoveryMethodLabel(
      filters,
      activeGenreName,
    )

  useEffect(() => {
    document.title = 'Movies — CineScope'
  }, [])

  useEffect(() => {
    setSelectedMovieId(null)
  }, [
    filters.genreId,
    filters.minimumScore,
    filters.releasePeriod,
    filters.runtime,
    filters.sort,
  ])

  function toggleMovieRecord(movieId: number): void {
    setSelectedMovieId((currentMovieId) =>
      currentMovieId === movieId
        ? null
        : movieId,
    )
  }

  let registerContent

  if (movies.isPending) {
    registerContent = (
      <LoadingState
        title="Loading movies"
        message="Getting released movies from TMDB."
      />
    )
  } else if (movies.isInitialError) {
    registerContent = (
      <ErrorState
        title="Movies could not load"
        message={
          movies.errorMessage ??
          'TMDB did not return the requested movies.'
        }
        onRetry={movies.retry}
        retryLabel="Try again"
      />
    )
  } else if (movies.isEmpty) {
    registerContent = (
      <div className="movie-register__empty-state">
        <EmptyState
          title="No film records were returned"
          message="No released movies match these filters."
        />

        {!isDefault ? (
          <button
            type="button"
            onClick={resetFilters}
          >
            Reset filters
          </button>
        ) : null}
      </div>
    )
  } else {
    const leadRecord = movies.records[0]
    const contactRecords = movies.records.slice(1)

    registerContent = leadRecord ? (
      <>
        <div
          className="movie-register__result-summary"
          aria-live="polite"
        >
          <p>
            <strong>
              {movies.records.length.toLocaleString()}
            </strong>{' '}
            movies loaded
          </p>

          <p>
            {movies.totalResults.toLocaleString()}{' '}
            reported matches in the TMDB catalogue
          </p>
        </div>

        <OpeningProjection
          genreNames={genreNames}
          record={leadRecord}
        />

        {contactRecords.length > 0 ? (
          <section
            className="movie-contact-sheet"
            aria-labelledby="movie-contact-sheet-title"
          >
            <header className="movie-contact-sheet__heading">
              <div>
                <p className="archive-label">
                  More movies
                </p>

                <h3
                  className="movie-contact-sheet__title font-display"
                  id="movie-contact-sheet-title"
                >
                  Explore the results.
                </h3>
              </div>

              <p>
                Select a movie to see more details.
              </p>
            </header>

            <div className="movie-contact-sheet__grid">
              {contactRecords.map(
                (record, index) => (
                  <ContactSheetRecord
                    genreNames={genreNames}
                    index={index}
                    isSelected={
                      selectedMovieId === record.id
                    }
                    key={record.id}
                    onToggle={toggleMovieRecord}
                    record={record}
                  />
                ),
              )}
            </div>
          </section>
        ) : null}

        <MovieDiscoveryContinuation
          errorMessage={movies.errorMessage}
          hasNextPage={Boolean(
            movies.hasNextPage,
          )}
          isFetchingNextPage={
            movies.isFetchingNextPage
          }
          isNextPageError={
            movies.isNextPageError
          }
          loadedCount={movies.records.length}
          loadedPageCount={
            movies.loadedPageCount
          }
          onContinue={movies.loadNextPage}
          totalResults={movies.totalResults}
        />
      </>
    ) : (
      <div className="movie-register__empty-state">
        <EmptyState
          title="No film records were returned"
          message="TMDB returned no movies that CineScope can display."
        />

        {!isDefault ? (
          <button
            type="button"
            onClick={resetFilters}
          >
            Reset filters
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="movie-register-page projection-surface">
      <header className="movie-register__opening">
        <div>
          <p className="archive-label">
            Movies
          </p>

          <h1 className="movie-register__title font-display text-balance">
            Browse movies.
          </h1>
        </div>

        <div className="movie-register__opening-copy">
          <p className="text-pretty">
            Filter by genre, year, runtime, rating, or popularity.
          </p>
        </div>
      </header>

      <hr className="editorial-rule" />

      <MovieDiscoveryControls
        filters={filters}
        genreErrorMessage={genres.errorMessage}
        genreItems={genres.items}
        isDefault={isDefault}
        isGenreEmpty={genres.isEmpty}
        isGenreError={genres.isError}
        isGenrePending={genres.isPending}
        methodLabel={methodLabel}
        onGenreChange={setGenreId}
        onMinimumScoreChange={setMinimumScore}
        onReleasePeriodChange={setReleasePeriod}
        onReset={resetFilters}
        onRetryGenres={genres.retry}
        onRuntimeChange={setRuntime}
        onSortChange={setSort}
      />

      <section
        className="movie-register__catalogue"
        aria-labelledby="movie-register-selection"
        aria-busy={
          movies.isPending ||
          movies.isFetchingNextPage
        }
      >
        <header className="movie-register__catalogue-heading">
          <div>
            <p className="archive-label">
              Opening selection
            </p>

            <h2
              className="movie-register__section-title font-display"
              id="movie-register-selection"
            >
              {isDefault
                ? 'Current attention'
                : 'Selected view'}
            </h2>
          </div>

          <div className="movie-register__method">
            <p>{methodLabel}</p>
          </div>
        </header>

        {registerContent}
      </section>
    </div>
  )
}
