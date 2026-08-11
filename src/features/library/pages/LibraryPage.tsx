import { ArrowRight } from 'lucide-react'
import { useEffect } from 'react'
import {
  Link,
  useSearchParams,
} from 'react-router'

import {
  getTmdbBackdropUrl,
  getTmdbImageSrcSet,
  getTmdbImageUrl,
  getTmdbPosterUrl,
} from '../../../lib/tmdb/image'

import { LibraryControls } from '../components/LibraryControls'
import {
  getContinueWatchingRecords,
  getLibrarySyncCopy,
  type LibraryRecord,
} from '../data/library'
import { useLibrary } from '../hooks/useLibrary'

import './LibraryPage.css'

type LibraryView =
  | 'all'
  | 'watchlist'
  | 'watched'
  | 'favorites'
  | 'rated'

type LibraryViewOption = {
  label: string
  value: LibraryView
}

const libraryViewOptions: ReadonlyArray<LibraryViewOption> =
  [
    { label: 'All records', value: 'all' },
    { label: 'Watchlist', value: 'watchlist' },
    { label: 'Watched', value: 'watched' },
    { label: 'Favourites', value: 'favorites' },
    { label: 'Rated', value: 'rated' },
  ]

function parseLibraryView(
  value: string | null,
): LibraryView {
  const option = libraryViewOptions.find(
    (candidate) => candidate.value === value,
  )

  return option?.value ?? 'all'
}

function serializeLibraryView(
  view: LibraryView,
): URLSearchParams {
  const searchParams = new URLSearchParams()

  if (view !== 'all') {
    searchParams.set('view', view)
  }

  return searchParams
}

function filterLibraryRecords(
  records: LibraryRecord[],
  view: LibraryView,
): LibraryRecord[] {
  switch (view) {
    case 'watchlist':
      return records.filter(
        (record) => !record.isWatched,
      )

    case 'watched':
      return records.filter(
        (record) => record.isWatched,
      )

    case 'favorites':
      return records.filter(
        (record) => record.isFavorite,
      )

    case 'rated':
      return records.filter(
        (record) => record.userRating !== null,
      )

    case 'all':
      return records
  }
}

function getRecordTarget(
  record: LibraryRecord,
): string {
  if (record.mediaType === 'movie') {
    return `/movies/${record.id}`
  }

  return `/tv/${record.id}`
}

function formatSavedDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Saved locally'
  }

  return `Saved ${new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)}`
}

function LibraryCard({
  index,
  record,
}: {
  index: number
  record: LibraryRecord
}) {
  const posterUrl = getTmdbPosterUrl(
    record.posterPath,
    'w500',
  )
  const backdropUrl = getTmdbBackdropUrl(
    record.backdropPath,
    'w780',
  )
  const usePoster = Boolean(posterUrl)
  const imageUrl = posterUrl ?? backdropUrl
  const imageSrcSet = usePoster
    ? getTmdbImageSrcSet(
        record.posterPath,
        ['w185', 'w342', 'w500'],
      )
    : getTmdbImageSrcSet(
        record.backdropPath,
        ['w300', 'w780'],
      )
  const titleId = `library-record-${record.mediaType}-${record.id}`

  return (
    <article
      className="library-card"
      aria-labelledby={titleId}
    >
      <div
        className={[
          'library-card__artwork',
          usePoster
            ? 'library-card__artwork--portrait'
            : 'library-card__artwork--landscape',
        ].join(' ')}
      >
        {imageUrl ? (
          <img
            alt={`${record.title} ${
              usePoster ? 'poster' : 'backdrop artwork'
            }`}
            decoding="async"
            loading="lazy"
            sizes="(max-width: 40rem) 38vw, (max-width: 64rem) 30vw, 22vw"
            src={imageUrl}
            srcSet={imageSrcSet}
          />
        ) : (
          <div
            className="library-card__fallback"
            aria-hidden="true"
          >
            {record.title.slice(0, 2).toUpperCase()}
          </div>
        )}

        <span className="library-card__index">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      <div className="library-card__copy">
        <div className="library-card__classification">
          <span>
            {record.mediaType === 'movie'
              ? 'Film record'
              : 'Series record'}
          </span>

          <span>{formatSavedDate(record.savedAt)}</span>
        </div>

        <h3
          className="library-card__title font-display"
          id={titleId}
        >
          {record.title}
        </h3>

        <p className="library-card__metadata">
          {record.releaseYear ?? 'Date unknown'}

          {record.userRating !== null ? (
            <>
              <span aria-hidden="true"> / </span>
              Your score {record.userRating} / 10
            </>
          ) : null}
        </p>

        <p className="library-card__overview text-pretty">
          {record.overview ??
            'Synopsis unavailable for this saved record.'}
        </p>

        <div className="library-card__states">
          <span>
            {record.isWatched
              ? 'Watched'
              : 'Watchlist'}
          </span>

          {record.isFavorite ? (
            <span>Favourite</span>
          ) : null}
        </div>

        <LibraryControls
          candidate={record}
        />

        <Link
          className="library-card__record-link"
          to={getRecordTarget(record)}
        >
          {record.mediaType === 'movie'
            ? 'Open film record'
            : 'Open series record'}
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}

function ContinueWatchingShelf({
  records,
}: {
  records: LibraryRecord[]
}) {
  const continueRecords =
    getContinueWatchingRecords(records).slice(0, 4)

  if (continueRecords.length === 0) return null

  return (
    <section
      className="continue-watching"
      aria-labelledby="continue-watching-heading"
    >
      <header className="continue-watching__heading">
        <div>
          <p className="archive-label">
            Active transmissions
          </p>
          <h2
            className="font-display"
            id="continue-watching-heading"
          >
            Continue watching.
          </h2>
        </div>
        <p>
          Episode checkpoints stay local first and follow
          your account when archive sync is active.
        </p>
      </header>

      <div className="continue-watching__grid">
        {continueRecords.map((record) => {
          const progress = record.tvProgress!
          const resumeEpisode = progress.resumeEpisode
          const episodeStillUrl = getTmdbImageUrl(
            resumeEpisode?.stillPath ?? null,
            'w780',
          )
          const artworkUrl =
            episodeStillUrl ??
            getTmdbBackdropUrl(record.backdropPath, 'w780') ??
            getTmdbPosterUrl(record.posterPath, 'w500')
          const target = resumeEpisode
            ? `/tv/${record.id}/season/${resumeEpisode.seasonNumber}/episode/${resumeEpisode.episodeNumber}`
            : `/tv/${record.id}`
          const episodeCode = resumeEpisode
            ? `S${String(
                resumeEpisode.seasonNumber,
              ).padStart(2, '0')}E${String(
                resumeEpisode.episodeNumber,
              ).padStart(2, '0')}`
            : 'Series checkpoint'

          return (
            <article
              className="continue-watching__card"
              key={record.id}
            >
              <Link to={target}>
                <div className="continue-watching__artwork">
                  {artworkUrl ? (
                    <img
                      alt=""
                      decoding="async"
                      loading="lazy"
                      src={artworkUrl}
                    />
                  ) : (
                    <span aria-hidden="true">
                      {record.title
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  )}
                  <span>{episodeCode}</span>
                </div>
                <div className="continue-watching__copy">
                  <p>{record.title}</p>
                  <h3 className="font-display">
                    {resumeEpisode?.name ??
                      'Return to the series record'}
                  </h3>
                  <small>
                    {progress.watchedEpisodeKeys.length}{' '}
                    {progress.watchedEpisodeKeys.length === 1
                      ? 'episode'
                      : 'episodes'}{' '}
                    watched
                  </small>
                  <span>
                    {resumeEpisode
                      ? 'Open next episode'
                      : 'Open series record'}{' '}
                    <ArrowRight aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export function LibraryPage() {
  const [searchParams, setSearchParams] =
    useSearchParams()
  const {
    records,
    retrySync,
    syncError,
    syncStatus,
  } = useLibrary()
  const syncCopy = getLibrarySyncCopy(
    syncStatus,
    syncError,
  )
  const view = parseLibraryView(
    searchParams.get('view'),
  )
  const filteredRecords = filterLibraryRecords(
    records,
    view,
  )
  const activeView =
    libraryViewOptions.find(
      (option) => option.value === view,
    ) ?? libraryViewOptions[0]

  const counts: Record<LibraryView, number> = {
    all: records.length,
    favorites: records.filter(
      (record) => record.isFavorite,
    ).length,
    rated: records.filter(
      (record) => record.userRating !== null,
    ).length,
    watched: records.filter(
      (record) => record.isWatched,
    ).length,
    watchlist: records.filter(
      (record) => !record.isWatched,
    ).length,
  }

  useEffect(() => {
    document.title = `${activeView.label} — Library — CineScope`
  }, [activeView.label])

  return (
    <div className="library-page projection-surface">
      <header className="library-opening">
        <div>
          <p className="archive-label">
            08 / Personal Library
          </p>

          <h1 className="library-opening__title font-display text-balance">
            Keep the records you want to return to.
          </h1>
        </div>

        <div className="library-opening__copy">
          <p className="text-pretty">
            A private working collection for films and
            series you save, watch, favour, or rate.
          </p>

          <div
            className={`library-opening__sync library-opening__sync--${syncStatus}`}
            role="status"
          >
            <p className="archive-label">
              {syncCopy.label}
            </p>
            <p>{syncCopy.detail}</p>
            {syncStatus === 'error' ? (
              <button onClick={retrySync} type="button">
                Retry cloud sync
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <ContinueWatchingShelf records={records} />

      <section
        className="library-index"
        aria-labelledby="library-index-title"
      >
        <header className="library-index__heading">
          <div>
            <p className="archive-label">
              Collection index
            </p>

            <h2
              className="library-index__title font-display"
              id="library-index-title"
            >
              Read your archive.
            </h2>
          </div>

          <p>
            Every control saves locally first
            {syncStatus === 'local'
              ? ' in this browser.'
              : ' while account sync runs in the background.'}
          </p>
        </header>

        <div
          className="library-index__views"
          aria-label="Filter library records"
          role="group"
        >
          {libraryViewOptions.map((option) => (
            <button
              aria-pressed={view === option.value}
              key={option.value}
              onClick={() =>
                setSearchParams(
                  serializeLibraryView(option.value),
                )
              }
              type="button"
            >
              <span>{option.label}</span>
              <strong>{counts[option.value]}</strong>
            </button>
          ))}
        </div>
      </section>

      <section
        className="library-register"
        aria-labelledby="library-register-title"
      >
        <header className="library-register__heading">
          <div>
            <p className="archive-label">
              Active shelf
            </p>

            <h2
              className="library-register__title font-display"
              id="library-register-title"
            >
              {activeView.label}.
            </h2>
          </div>

          <p aria-live="polite">
            {filteredRecords.length.toLocaleString()}{' '}
            {filteredRecords.length === 1
              ? 'record'
              : 'records'}{' '}
            on this shelf.
          </p>
        </header>

        {records.length === 0 ? (
          <div className="library-empty">
            <p className="archive-label">
              Empty collection
            </p>

            <h3 className="font-display">
              Your archive begins with one record.
            </h3>

            <p>
              Save a film from its detail page or save
              a movie or series directly from Search.
            </p>

            <div>
              <Link to="/discover">
                Enter discovery
                <ArrowRight aria-hidden="true" />
              </Link>

              <Link to="/search">
                Search the archive
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="library-empty">
            <p className="archive-label">
              Empty shelf
            </p>

            <h3 className="font-display">
              No records match this status yet.
            </h3>

            <p>
              Change a saved record’s watched,
              favourite, or rating state, or return to
              the complete collection.
            </p>

            <button
              onClick={() =>
                setSearchParams(
                  new URLSearchParams(),
                )
              }
              type="button"
            >
              Show all records
            </button>
          </div>
        ) : (
          <div className="library-register__grid">
            {filteredRecords.map((record, index) => (
              <LibraryCard
                index={index}
                key={`${record.mediaType}:${record.id}`}
                record={record}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
