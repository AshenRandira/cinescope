import {
  ArrowRight,
  EyeOff,
  RotateCw,
  Undo2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Link,
  useNavigate,
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

import {
  defaultRecommendationMood,
  getRecommendationMoodDefinition,
  parseRecommendationMood,
  recommendationMoodDefinitions,
  type RecommendationMoodId,
} from '../../recommendations/data/recommendationMoods'
import { useRecommendationFeedback } from '../../recommendations/hooks/useRecommendationFeedback'

import { useDiscoverExperience } from '../hooks/useDiscoverExperience'

import './DiscoverPage.css'

type DiscoverRecordProps = {
  isArchiveSignal: boolean
  onDismiss: (record: DiscoverRecord) => void
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
    ? 'View movie details'
    : 'View series details'
}

function getScoreLabel(
  score: number | null,
): string {
  return score === null
    ? 'Not yet rated'
    : `${score.toFixed(1)} / 10`
}

function getFeedbackStatusLabel(
  status:
    | 'connecting'
    | 'error'
    | 'local'
    | 'synced'
    | 'syncing',
): string {
  switch (status) {
    case 'connecting':
    case 'syncing':
      return 'Saving your feedback'
    case 'error':
      return 'Saved locally / sync paused'
    case 'local':
      return 'Saved in this browser'
    case 'synced':
      return 'Saved to your account'
  }
}

function RecommendationExplanation({
  record,
}: {
  record: DiscoverRecord
}) {
  if (record.recommendationReasons.length === 0) {
    return null
  }

  return (
    <aside className="discover-recommendation-reason">
      <p className="archive-label">Why it matches</p>
      {record.recommendationReasons.map((reason) => (
        <p key={reason}>{reason}</p>
      ))}
    </aside>
  )
}

function DiscoverLead({
  isArchiveSignal,
  onDismiss,
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
            ? 'Featured movie'
            : 'Featured series'}
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

        {isArchiveSignal ? (
          <RecommendationExplanation record={record} />
        ) : null}

        <div className="discover-record-actions">
          <Link
            className="discover-record-link"
            to={getRecordTarget(record)}
          >
            {getRecordAction(record)}
            <ArrowRight aria-hidden="true" />
          </Link>

          {isArchiveSignal ? (
            <button
              aria-label={`Not interested in ${record.title}`}
              onClick={() => onDismiss(record)}
              type="button"
            >
              <EyeOff aria-hidden="true" />
              Not interested
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function DiscoverCard({
  index,
  isArchiveSignal,
  onDismiss,
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

        {isArchiveSignal ? (
          <RecommendationExplanation record={record} />
        ) : null}

        <div className="discover-record-actions">
          <Link
            className="discover-record-link"
            to={getRecordTarget(record)}
          >
            {getRecordAction(record)}
            <ArrowRight aria-hidden="true" />
          </Link>

          {isArchiveSignal ? (
            <button
              aria-label={`Not interested in ${record.title}`}
              onClick={() => onDismiss(record)}
              type="button"
            >
              <EyeOff aria-hidden="true" />
              Not interested
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export function DiscoverPage() {
  const navigate = useNavigate()
  const [lastDismissedRecord, setLastDismissedRecord] =
    useState<DiscoverRecord | null>(null)
  const [searchParams, setSearchParams] =
    useSearchParams()
  const signal = parseDiscoverSignal(
    searchParams.get('signal'),
  )
  const page = parseDiscoverPage(
    searchParams.get('page'),
  )
  const mood = parseRecommendationMood(
    searchParams.get('mood'),
  )
  const moodDefinition =
    getRecommendationMoodDefinition(mood)
  const {
    dismissRecommendation,
    retrySync: retryFeedbackSync,
    restoreRecommendation,
    syncError: feedbackSyncError,
    syncStatus: feedbackSyncStatus,
  } = useRecommendationFeedback()
  const discovery = useDiscoverExperience(
    signal,
    page,
    mood,
  )
  const isArchiveSignal = signal === 'archive'

  useEffect(() => {
    document.title = `${discovery.definition.label} — Discover — CineScope`
  }, [discovery.definition.label])

  function handleSignalChange(
    nextSignal: DiscoverSignalId,
  ): void {
    setLastDismissedRecord(null)
    setSearchParams(
      serializeDiscoverState(nextSignal, 1),
    )
  }

  function handleRecut(): void {
    const nextPage =
      page >= discovery.availablePages
        ? 1
        : page + 1

    const nextSearchParams = serializeDiscoverState(
      signal,
      nextPage,
    )

    if (
      isArchiveSignal &&
      mood !== defaultRecommendationMood
    ) {
      nextSearchParams.set('mood', mood)
    }

    setSearchParams(nextSearchParams)
  }

  function handleMoodChange(
    nextMood: RecommendationMoodId,
  ): void {
    const nextSearchParams = serializeDiscoverState(
      'archive',
      1,
    )

    if (nextMood !== defaultRecommendationMood) {
      nextSearchParams.set('mood', nextMood)
    }

    setLastDismissedRecord(null)
    setSearchParams(nextSearchParams)
  }

  function handleDismiss(record: DiscoverRecord): void {
    dismissRecommendation(record.mediaType, record.id)
    setLastDismissedRecord(record)
  }

  function handleUndoDismissal(): void {
    if (!lastDismissedRecord) return

    restoreRecommendation(
      lastDismissedRecord.mediaType,
      lastDismissedRecord.id,
    )
    setLastDismissedRecord(null)
  }

  let projectionContent

  if (discovery.isPending) {
    projectionContent = (
      <LoadingState
        title="Finding recommendations"
        message={
          isArchiveSignal
            ? 'Finding titles related to movies and series you enjoyed.'
            : `Loading ${discovery.definition.label.toLowerCase()} titles from TMDB.`
        }
      />
    )
  } else if (discovery.isError) {
    projectionContent = (
      <ErrorState
        title="Recommendations could not load"
        message={
          discovery.errorMessage ??
          'TMDB did not return the requested discovery records.'
        }
        onRetry={discovery.retry}
        retryLabel="Try again"
      />
    )
  } else if (discovery.isEmpty) {
    const needsArchiveRecords =
      isArchiveSignal && !discovery.hasSeeds

    projectionContent = (
      <EmptyState
        actionLabel={
          needsArchiveRecords
            ? 'Explore films to save'
            : 'Show trending titles'
        }
        message={
          needsArchiveRecords
            ? 'Save or favourite a few titles, or rate them 7 or higher. CineScope will use those choices to find related titles.'
            : 'No new titles were available for this method. Try another option.'
        }
        onAction={() => {
          if (needsArchiveRecords) {
            navigate('/movies')
            return
          }

          setSearchParams(new URLSearchParams())
        }}
        title={
          needsArchiveRecords
            ? 'Add a few titles first'
            : 'No recommendations found'
        }
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
            recommendations
          </p>

          <p>
            {isArchiveSignal
              ? `${discovery.seedTitles.length} archive ${
                  discovery.seedTitles.length === 1
                    ? 'anchor'
                    : 'anchors'
                } / page ${page}`
              : `Page ${page} of ${discovery.availablePages}`}
          </p>
        </div>

        <DiscoverLead
          isArchiveSignal={isArchiveSignal}
          onDismiss={handleDismiss}
          record={leadRecord}
        />

        {remainingRecords.length > 0 ? (
          <section
            className="discover-contact-sheet"
            aria-labelledby="discover-contact-sheet-title"
          >
            <header className="discover-contact-sheet__heading">
              <div>
                <p className="archive-label">
                  More recommendations
                </p>

                <h3
                  className="discover-contact-sheet__title font-display"
                  id="discover-contact-sheet-title"
                >
                  More to explore.
                </h3>
              </div>

              <p>
                {isArchiveSignal
                  ? 'These suggestions are related to titles in your archive.'
                  : 'These titles use the same catalogue method. They are not personalized.'}
              </p>
            </header>

            <div className="discover-contact-sheet__grid">
              {remainingRecords.map(
                (record, index) => (
                  <DiscoverCard
                    index={index}
                    isArchiveSignal={isArchiveSignal}
                    key={`${record.mediaType}:${record.id}`}
                    onDismiss={handleDismiss}
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
    <div className="discover-page projection-surface">
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
            Choose a discovery method or get suggestions
            based on titles you enjoyed.
          </p>

          <p>
            Every option explains how its results are
            selected from TMDB.
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
              Discovery methods
            </p>

            <h2
              className="discover-console__title font-display"
              id="discover-console-title"
            >
              Choose how to look.
            </h2>
          </div>

          <p>
            Select an option to update the recommendations.
          </p>
        </header>

        <div
          className="discover-console__signals"
          aria-label="Discovery method"
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

            <p className="discover-console__method-copy">
              {discovery.definition.method}
            </p>

            {isArchiveSignal ? (
              <div className="discover-console__personalization">
                <p className="discover-console__anchors">
                  <strong>Based on</strong>
                  {discovery.seedTitles.length > 0
                    ? discovery.seedTitles.join(' / ')
                    : 'Add records to your library to begin.'}
                </p>
                <p className="discover-console__anchors">
                  <strong>Your preferences</strong>
                  {discovery.preferenceSummary}
                </p>
                <div className="discover-console__anchors">
                  <strong>Feedback status</strong>
                  <p>
                    {feedbackSyncError ??
                      getFeedbackStatusLabel(
                        feedbackSyncStatus,
                      )}
                  </p>
                  {feedbackSyncError ? (
                    <button
                      onClick={retryFeedbackSync}
                      type="button"
                    >
                      Retry feedback sync
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {isArchiveSignal ? (
              <fieldset className="discover-console__moods">
                <legend>Mood for this session</legend>
                <p>{moodDefinition.description}</p>
                <div>
                  {recommendationMoodDefinitions.map(
                    (definition) => (
                      <button
                        aria-pressed={
                          mood === definition.value
                        }
                        key={definition.value}
                        onClick={() =>
                          handleMoodChange(
                            definition.value,
                          )
                        }
                        type="button"
                      >
                        {definition.label}
                      </button>
                    ),
                  )}
                </div>
              </fieldset>
            ) : null}
          </div>

          <button
            aria-label={`Re-cut ${discovery.definition.label} discovery results`}
            disabled={
              discovery.isPending ||
              (isArchiveSignal && !discovery.hasSeeds)
            }
            onClick={handleRecut}
            type="button"
          >
            <RotateCw aria-hidden="true" />
            Show different titles
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
              Results page / {String(page).padStart(2, '0')}
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
          {lastDismissedRecord ? (
            <div
              className="discover-feedback-notice"
              role="status"
            >
              <p>
                <strong>{lastDismissedRecord.title}</strong>{' '}
                will no longer appear in recommendations.
              </p>
              <button
                onClick={handleUndoDismissal}
                type="button"
              >
                <Undo2 aria-hidden="true" />
                Undo
              </button>
            </div>
          ) : null}
          {projectionContent}
        </div>
      </section>
    </div>
  )
}
