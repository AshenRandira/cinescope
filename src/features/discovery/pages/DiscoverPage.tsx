import {
  ArrowRight,
  RotateCw,
} from 'lucide-react'
import { useEffect } from 'react'
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
  discoverSignalDefinitions,
  parseDiscoverPage,
  parseDiscoverSignal,
  serializeDiscoverState,
  type DiscoverRecord,
  type DiscoverSignalId,
} from '../data/discoverExperience'

import { useDiscoverExperience } from '../hooks/useDiscoverExperience'

import './DiscoverPage.css'

type DiscoverRecordProps = {
  record: DiscoverRecord
}

type DiscoverCardProps = DiscoverRecordProps & {
  index: number
}

function getRecordTarget(
  record: DiscoverRecord,
): string {
  if (record.mediaType === 'movie') {
    return `/movies/${record.id}`
  }

  return `/tv/${record.id}`
}

function getRecordAction(
  record: DiscoverRecord,
): string {
  return record.mediaType === 'movie'
    ? 'Open film record'
    : 'Open series record'
}

function getScoreLabel(
  score: number | null,
): string {
  return score === null
    ? 'Not yet rated'
    : `${score.toFixed(1)} / 10`
}

function DiscoverLead({
  record,
}: DiscoverRecordProps) {
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
      className="discover-lead"
      aria-labelledby={`discover-lead-${record.mediaType}-${record.id}`}
    >
      <div
        className={[
          'discover-lead__artwork',
          useBackdrop
            ? 'discover-lead__artwork--landscape'
            : 'discover-lead__artwork--portrait',
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
            fetchPriority="high"
            loading="eager"
            sizes="(max-width: 48rem) 100vw, 62vw"
            src={imageUrl}
            srcSet={imageSrcSet}
          />
        ) : null}

        <span className="discover-frame-index">
          OPENING FRAME
        </span>
      </div>

      <div className="discover-lead__copy">
        <p className="archive-label">
          {record.mediaType === 'movie'
            ? 'Feature signal'
            : 'Episodic signal'}
        </p>

        <h3
          className="discover-lead__title font-display"
          id={`discover-lead-${record.mediaType}-${record.id}`}
        >
          {record.title}
        </h3>

        <p className="discover-record-code">
          <span>
            {record.dateYear ?? 'Date unknown'}
          </span>
          <span aria-hidden="true">/</span>
          <span>
            {record.originalLanguage.toUpperCase()}
          </span>
          <span aria-hidden="true">/</span>
          <span>{getScoreLabel(record.score)}</span>
        </p>

        <p className="discover-lead__overview text-pretty">
          {record.overview ??
            'This archive record does not yet include a synopsis.'}
        </p>

        <dl className="discover-lead__facts">
          <div>
            <dt>Record type</dt>
            <dd>
              {record.mediaType === 'movie'
                ? 'Motion picture'
                : 'Television series'}
            </dd>
          </div>

          <div>
            <dt>Audience volume</dt>
            <dd>
              {record.voteCount.toLocaleString()}{' '}
              recorded votes
            </dd>
          </div>
        </dl>

        <Link
          className="discover-record-link"
          to={getRecordTarget(record)}
        >
          {getRecordAction(record)}
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}

function DiscoverCard({
  index,
  record,
}: DiscoverCardProps) {
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
  const recordNumber = String(index + 2).padStart(
    2,
    '0',
  )
  const titleId = `discover-record-${record.mediaType}-${record.id}`

  return (
    <article
      className="discover-card"
      aria-labelledby={titleId}
    >
      <div
        className={[
          'discover-card__artwork',
          usePoster
            ? 'discover-card__artwork--portrait'
            : 'discover-card__artwork--landscape',
        ].join(' ')}
      >
        {imageUrl ? (
          <img
            alt={`${record.title} ${
              usePoster ? 'poster' : 'backdrop artwork'
            }`}
            decoding="async"
            loading="lazy"
            sizes="(max-width: 40rem) 38vw, (max-width: 64rem) 30vw, 20vw"
            src={imageUrl}
            srcSet={imageSrcSet}
          />
        ) : null}

        <span className="discover-frame-index">
          {recordNumber}
        </span>
      </div>

      <div className="discover-card__copy">
        <p className="discover-card__classification">
          {record.mediaType === 'movie'
            ? 'Film record'
            : 'Series record'}
        </p>

        <h3
          className="discover-card__title font-display"
          id={titleId}
        >
          {record.title}
        </h3>

        <p className="discover-record-code">
          <span>
            {record.dateYear ?? 'Date unknown'}
          </span>
          <span aria-hidden="true">/</span>
          <span>
            {record.originalLanguage.toUpperCase()}
          </span>
        </p>

        <p className="discover-card__overview text-pretty">
          {record.overview ??
            'Synopsis unavailable for this archive record.'}
        </p>

        <div className="discover-card__rating">
          <span>{getScoreLabel(record.score)}</span>
          <span>
            {record.voteCount.toLocaleString()} votes
          </span>
        </div>

        <Link to={getRecordTarget(record)}>
          {getRecordAction(record)}
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}

export function DiscoverPage() {
  const [searchParams, setSearchParams] =
    useSearchParams()
  const signal = parseDiscoverSignal(
    searchParams.get('signal'),
  )
  const page = parseDiscoverPage(
    searchParams.get('page'),
  )
  const discovery = useDiscoverExperience(
    signal,
    page,
  )

  useEffect(() => {
    document.title = `${discovery.definition.label} — Discover — CineScope`
  }, [discovery.definition.label])

  function handleSignalChange(
    nextSignal: DiscoverSignalId,
  ): void {
    setSearchParams(
      serializeDiscoverState(nextSignal, 1),
    )
  }

  function handleRecut(): void {
    const nextPage =
      page >= discovery.availablePages
        ? 1
        : page + 1

    setSearchParams(
      serializeDiscoverState(signal, nextPage),
    )
  }

  let projectionContent

  if (discovery.isPending) {
    projectionContent = (
      <LoadingState
        title="Cutting a new discovery reel"
        message={`Reading the ${discovery.definition.label.toLowerCase()} signal from TMDB.`}
      />
    )
  } else if (discovery.isError) {
    projectionContent = (
      <ErrorState
        title="The discovery signal was interrupted"
        message={
          discovery.errorMessage ??
          'TMDB did not return the requested discovery records.'
        }
        onRetry={discovery.retry}
        retryLabel="Read the signal again"
      />
    )
  } else if (discovery.isEmpty) {
    projectionContent = (
      <EmptyState
        actionLabel="Return to current collision"
        message="TMDB responded successfully, but this cut contained no usable film or series artwork."
        onAction={() =>
          setSearchParams(new URLSearchParams())
        }
        title="This discovery reel is empty"
      />
    )
  } else {
    const leadRecord = discovery.records[0]
    const remainingRecords =
      discovery.records.slice(1, 13)

    projectionContent = leadRecord ? (
      <>
        <div
          className="discover-projection__summary"
          aria-live="polite"
        >
          <p>
            <strong>
              {discovery.records.length.toLocaleString()}
            </strong>{' '}
            usable records in this cut
          </p>

          <p>
            Cut {page} of{' '}
            {discovery.availablePages} available
          </p>
        </div>

        <DiscoverLead record={leadRecord} />

        {remainingRecords.length > 0 ? (
          <section
            className="discover-contact-sheet"
            aria-labelledby="discover-contact-sheet-title"
          >
            <header className="discover-contact-sheet__heading">
              <div>
                <p className="archive-label">
                  Supporting frames
                </p>

                <h3
                  className="discover-contact-sheet__title font-display"
                  id="discover-contact-sheet-title"
                >
                  Keep following the pattern.
                </h3>
              </div>

              <p>
                These records share a transparent
                catalogue method, not a prediction
                about personal taste.
              </p>
            </header>

            <div className="discover-contact-sheet__grid">
              {remainingRecords.map(
                (record, index) => (
                  <DiscoverCard
                    index={index}
                    key={`${record.mediaType}:${record.id}`}
                    record={record}
                  />
                ),
              )}
            </div>
          </section>
        ) : null}
      </>
    ) : null
  }

  return (
    <main className="discover-page projection-surface">
      <header className="discover-opening">
        <div>
          <p className="archive-label">
            02 / Discovery Room
          </p>

          <h1 className="discover-opening__title font-display text-balance">
            Discovery is a method, not magic.
          </h1>
        </div>

        <div className="discover-opening__copy">
          <p className="text-pretty">
            Choose a visible catalogue signal, then
            move through alternate cuts without
            pretending an algorithm knows you.
          </p>

          <p>
            Every result comes from TMDB. The method
            for each signal is stated below and the
            URL preserves the active cut.
          </p>
        </div>
      </header>

      <section
        className="discover-console"
        aria-labelledby="discover-console-title"
      >
        <header className="discover-console__heading">
          <div>
            <p className="archive-label">
              Editorial signals
            </p>

            <h2
              className="discover-console__title font-display"
              id="discover-console-title"
            >
              Choose how to look.
            </h2>
          </div>

          <p>
            Each signal changes the source endpoint
            or its concrete catalogue constraints.
          </p>
        </header>

        <div
          className="discover-console__signals"
          aria-label="Discovery signal"
          role="group"
        >
          {discoverSignalDefinitions.map(
            (definition) => (
              <button
                aria-pressed={
                  signal === definition.value
                }
                key={definition.value}
                onClick={() =>
                  handleSignalChange(
                    definition.value,
                  )
                }
                type="button"
              >
                <span>{definition.index}</span>
                <strong>{definition.label}</strong>
              </button>
            ),
          )}
        </div>

        <div className="discover-console__method">
          <div>
            <p className="archive-label">
              Active method
            </p>

            <h3 className="font-display">
              {discovery.definition.title}
            </h3>

            <p>{discovery.definition.method}</p>
          </div>

          <button
            aria-label={`Re-cut ${discovery.definition.label} discovery results`}
            disabled={discovery.isPending}
            onClick={handleRecut}
            type="button"
          >
            <RotateCw aria-hidden="true" />
            Re-cut signal
          </button>
        </div>
      </section>

      <section
        className="discover-projection"
        aria-busy={discovery.isPending}
        aria-labelledby="discover-projection-title"
      >
        <header className="discover-projection__heading">
          <div>
            <p className="archive-label">
              Current reel / {String(page).padStart(2, '0')}
            </p>

            <h2
              className="discover-projection__title font-display"
              id="discover-projection-title"
            >
              {discovery.definition.label}.
            </h2>
          </div>

          <p>{discovery.definition.description}</p>
        </header>

        <div className="discover-projection__content">
          {projectionContent}
        </div>
      </section>
    </main>
  )
}
