import { ArrowRight } from 'lucide-react'
import {
  useEffect,
  useMemo,
} from 'react'
import {
  Link,
  useSearchParams,
} from 'react-router'

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
  getTvDiscoveryViewOption,
  parseTvDiscoveryView,
  serializeTvDiscoveryView,
  tvDiscoveryViewOptions,
  type TvDiscoveryRecord,
  type TvDiscoveryView,
} from '../data/tvDiscovery'

import { useTvDiscovery } from '../hooks/useTvDiscovery'

import './TvShowsPage.css'

type GenreLookup = ReadonlyMap<number, string>

type TvRecordProps = {
  genreNames: GenreLookup
  record: TvDiscoveryRecord
}

type TvCardProps = TvRecordProps & {
  index: number
}

function getGenreLabel(
  record: TvDiscoveryRecord,
  genreNames: GenreLookup,
  limit = 3,
): string {
  const resolvedGenres = record.genreIds
    .map((genreId) => genreNames.get(genreId))
    .filter(
      (genreName): genreName is string =>
        Boolean(genreName),
    )
    .slice(0, limit)

  return (
    resolvedGenres.join(' / ') ||
    'Genre unavailable'
  )
}

function getOriginLabel(
  record: TvDiscoveryRecord,
): string {
  return (
    record.originCountries.slice(0, 3).join(' / ') ||
    record.originalLanguage.toUpperCase()
  )
}

function getScoreLabel(
  record: TvDiscoveryRecord,
): string {
  return record.voteAverage === null
    ? 'Not yet rated'
    : `${record.voteAverage.toFixed(1)} / 10`
}

function getTvTarget(
  record: TvDiscoveryRecord,
): string {
  return `/tv/${record.id}`
}

function TelevisionLead({
  genreNames,
  record,
}: TvRecordProps) {
  const backdropUrl = getTmdbBackdropUrl(
    record.backdropPath,
    'w1280',
  )
  const posterUrl = getTmdbPosterUrl(
    record.posterPath,
    'w500',
  )
  const useBackdrop = Boolean(backdropUrl)
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
      className="tv-lead"
      aria-labelledby={`tv-lead-${record.id}`}
    >
      <div
        className={[
          'tv-lead__artwork',
          useBackdrop
            ? 'tv-lead__artwork--landscape'
            : 'tv-lead__artwork--portrait',
        ].join(' ')}
      >
        {imageUrl ? (
          <img
            alt={`${record.name} ${
              useBackdrop
                ? 'backdrop artwork'
                : 'poster'
            }`}
            decoding="async"
            fetchPriority="high"
            loading="eager"
            sizes="(max-width: 48rem) 100vw, 62vw"
            src={imageUrl}
            srcSet={imageSrcSet}
          />
        ) : (
          <div
            className="tv-artwork-fallback"
            aria-hidden="true"
          >
            Artwork unavailable
          </div>
        )}

        <span className="tv-signal-index">
          SIGNAL 01
        </span>
      </div>

      <div className="tv-lead__copy">
        <p className="archive-label">
          Primary transmission
        </p>

        <h3
          className="tv-lead__title font-display"
          id={`tv-lead-${record.id}`}
        >
          {record.name}
        </h3>

        <p className="tv-record-code">
          <span>
            {record.firstAirYear ??
              'First air date unavailable'}
          </span>
          <span aria-hidden="true">/</span>
          <span>{getOriginLabel(record)}</span>
          <span aria-hidden="true">/</span>
          <span>
            {getGenreLabel(
              record,
              genreNames,
            )}
          </span>
        </p>

        <p className="tv-lead__overview text-pretty">
          {record.overview ??
            'This television record does not yet include a synopsis.'}
        </p>

        <dl className="tv-signal-facts">
          <div>
            <dt>TMDB audience signal</dt>
            <dd>{getScoreLabel(record)}</dd>
          </div>

          <div>
            <dt>Recorded responses</dt>
            <dd>
              {record.voteCount.toLocaleString()}
            </dd>
          </div>
        </dl>

        <Link
          className="tv-record-link"
          to={getTvTarget(record)}
        >
          Open series record
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}

function TelevisionCard({
  genreNames,
  index,
  record,
}: TvCardProps) {
  const posterUrl = getTmdbPosterUrl(
    record.posterPath,
    'w500',
  )
  const imageSrcSet = getTmdbImageSrcSet(
    record.posterPath,
    ['w185', 'w342', 'w500'],
  )
  const recordNumber = String(index + 2).padStart(
    2,
    '0',
  )
  const titleId = `tv-record-${record.id}`

  return (
    <article
      className="tv-card"
      aria-labelledby={titleId}
    >
      <div className="tv-card__artwork">
        {posterUrl ? (
          <img
            alt={`${record.name} poster`}
            decoding="async"
            loading="lazy"
            sizes="(max-width: 40rem) 38vw, (max-width: 64rem) 30vw, 20vw"
            src={posterUrl}
            srcSet={imageSrcSet}
          />
        ) : (
          <div
            className="tv-artwork-fallback"
            aria-hidden="true"
          >
            <span>
              {record.name
                .slice(0, 2)
                .toUpperCase()}
            </span>
          </div>
        )}

        <span className="tv-signal-index">
          {recordNumber}
        </span>
      </div>

      <div className="tv-card__copy">
        <p className="tv-card__classification">
          {getGenreLabel(
            record,
            genreNames,
            2,
          )}
        </p>

        <h3
          className="tv-card__title font-display"
          id={titleId}
        >
          {record.name}
        </h3>

        <p className="tv-record-code">
          <span>
            {record.firstAirYear ?? 'Date unknown'}
          </span>
          <span aria-hidden="true">/</span>
          <span>{getOriginLabel(record)}</span>
        </p>

        <p className="tv-card__overview text-pretty">
          {record.overview ??
            'Synopsis unavailable for this television record.'}
        </p>

        <div className="tv-card__signal">
          <span>{getScoreLabel(record)}</span>
          <span>
            {record.voteCount.toLocaleString()} votes
          </span>
        </div>

        <footer className="tv-card__footer">
          <Link to={getTvTarget(record)}>
            Open series record
            <ArrowRight aria-hidden="true" />
          </Link>

          <span>Series record indexed</span>
        </footer>
      </div>
    </article>
  )
}

export function TvShowsPage() {
  const [searchParams, setSearchParams] =
    useSearchParams()
  const view = parseTvDiscoveryView(
    searchParams.get('view'),
  )
  const activeView =
    getTvDiscoveryViewOption(view)
  const { genres, shows } =
    useTvDiscovery(view)

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

  useEffect(() => {
    document.title = `${activeView.label} TV — CineScope`
  }, [activeView.label])

  function handleViewChange(
    nextView: TvDiscoveryView,
  ): void {
    setSearchParams(
      serializeTvDiscoveryView(nextView),
    )
  }

  let registerContent

  if (shows.isPending) {
    registerContent = (
      <LoadingState
        title="Tuning the television register"
        message={`Retrieving ${activeView.label.toLowerCase()} series from TMDB.`}
      />
    )
  } else if (shows.isInitialError) {
    registerContent = (
      <ErrorState
        title="The television signal was interrupted"
        message={
          shows.errorMessage ??
          'TMDB did not return the requested television records.'
        }
        onRetry={shows.retry}
        retryLabel="Retune the register"
      />
    )
  } else if (shows.isEmpty) {
    registerContent = (
      <EmptyState
        title="No television records were returned"
        message="TMDB responded successfully, but this transmission window did not contain usable series records."
      />
    )
  } else {
    const leadRecord = shows.records[0]
    const remainingRecords =
      shows.records.slice(1)

    registerContent = leadRecord ? (
      <>
        <div
          className="tv-register__summary"
          aria-live="polite"
        >
          <p>
            <strong>
              {shows.records.length.toLocaleString()}
            </strong>{' '}
            unique series currently tuned
          </p>

          <p>
            {shows.totalResults.toLocaleString()}{' '}
            reported matches in the TMDB catalogue
          </p>
        </div>

        <TelevisionLead
          genreNames={genreNames}
          record={leadRecord}
        />

        {remainingRecords.length > 0 ? (
          <section
            className="tv-contact-sheet"
            aria-labelledby="tv-contact-sheet-title"
          >
            <header className="tv-contact-sheet__heading">
              <div>
                <p className="archive-label">
                  Transmission index
                </p>

                <h3
                  className="tv-contact-sheet__title font-display"
                  id="tv-contact-sheet-title"
                >
                  Continue across the schedule.
                </h3>
              </div>

              <p>
                Each frame opens a complete series
                record with seasons, credits, viewing
                providers, and related transmissions.
              </p>
            </header>

            <div className="tv-contact-sheet__grid">
              {remainingRecords.map(
                (record, index) => (
                  <TelevisionCard
                    genreNames={genreNames}
                    index={index}
                    key={record.id}
                    record={record}
                  />
                ),
              )}
            </div>
          </section>
        ) : null}

        <section
          className="tv-continuation"
          aria-labelledby="tv-continuation-title"
        >
          <div>
            <p className="archive-label">
              Transmission continuation
            </p>

            <h3
              className="tv-continuation__title font-display"
              id="tv-continuation-title"
            >
              Keep the receiver open.
            </h3>

            <p aria-live="polite">
              {shows.isFetchingNextPage
                ? `Retrieving catalogue page ${shows.loadedPageCount + 1}.`
                : `${shows.records.length.toLocaleString()} series are currently visible.`}
            </p>
          </div>

          <div className="tv-continuation__action">
            {shows.isNextPageError ? (
              <div role="alert">
                <p>
                  The next catalogue page could not be
                  retrieved. Existing series remain
                  available.
                </p>

                {shows.errorMessage ? (
                  <p>{shows.errorMessage}</p>
                ) : null}
              </div>
            ) : null}

            {shows.hasNextPage ? (
              <button
                aria-busy={
                  shows.isFetchingNextPage
                }
                disabled={
                  shows.isFetchingNextPage
                }
                onClick={shows.loadNextPage}
                type="button"
              >
                {shows.isFetchingNextPage
                  ? 'Tuning next page'
                  : shows.isNextPageError
                    ? 'Retry next page'
                    : 'Load more series'}

                <ArrowRight aria-hidden="true" />
              </button>
            ) : (
              <p className="tv-continuation__complete">
                The available series pages have been
                fully tuned.
              </p>
            )}
          </div>
        </section>
      </>
    ) : null
  }

  return (
    <div className="tv-register-page projection-surface">
      <header className="tv-register__opening">
        <div>
          <p className="archive-label">
            06 / Television Register
          </p>

          <h1 className="tv-register__title font-display text-balance">
            Follow the signal beyond one night.
          </h1>
        </div>

        <div className="tv-register__opening-copy">
          <p className="text-pretty">
            Television records organised around
            attention, audience response, and current
            broadcast windows.
          </p>

          <p>
            These are TMDB catalogue views, not
            personalised recommendations or a
            CineScope quality ranking.
          </p>
        </div>
      </header>

      <section
        className="tv-frequency"
        aria-labelledby="tv-frequency-title"
      >
        <header className="tv-frequency__heading">
          <div>
            <p className="archive-label">
              Receiver controls
            </p>

            <h2
              className="tv-frequency__title font-display"
              id="tv-frequency-title"
            >
              Select a transmission.
            </h2>
          </div>

          <p>
            Change the catalogue view without losing
            a shareable archive address.
          </p>
        </header>

        <div
          className="tv-frequency__options"
          aria-label="Television catalogue view"
          role="group"
        >
          {tvDiscoveryViewOptions.map(
            (option, index) => (
              <button
                aria-pressed={
                  view === option.value
                }
                key={option.value}
                onClick={() =>
                  handleViewChange(option.value)
                }
                type="button"
              >
                <span>
                  {String(index + 1).padStart(
                    2,
                    '0',
                  )}
                </span>

                <strong>{option.label}</strong>

                <small>{option.eyebrow}</small>
              </button>
            ),
          )}
        </div>

        <p
          className="tv-frequency__method"
          aria-live="polite"
        >
          {activeView.description}
        </p>

        {genres.isPending ? (
          <p
            className="tv-frequency__genre-status"
            role="status"
          >
            Loading the TMDB television genre index.
          </p>
        ) : null}

        {genres.isError ? (
          <div
            className="tv-frequency__genre-error"
            role="status"
          >
            <p>
              {genres.errorMessage ??
                'The television genre index is temporarily unavailable.'}
            </p>

            <button
              onClick={genres.retry}
              type="button"
            >
              Retry genre index
            </button>
          </div>
        ) : null}
      </section>

      <section
        className="tv-register"
        aria-busy={
          shows.isPending ||
          shows.isFetchingNextPage
        }
        aria-labelledby="tv-register-title"
      >
        <header className="tv-register__heading">
          <div>
            <p className="archive-label">
              {activeView.eyebrow}
            </p>

            <h2
              className="tv-register__section-title font-display"
              id="tv-register-title"
            >
              {activeView.label} series.
            </h2>
          </div>

          <p>{activeView.description}</p>
        </header>

        {registerContent}
      </section>
    </div>
  )
}
