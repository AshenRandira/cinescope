import { useEffect } from 'react'
import { Link, useParams } from 'react-router'

import {
  ErrorState,
  LoadingState,
} from '../../../components/feedback'
import {
  getTmdbImageSrcSet,
  getTmdbImageUrl,
} from '../../../lib/tmdb/image'

import type {
  TmdbTvCrewMember,
  TmdbTvSeasonEpisode,
} from '../../../types/tmdb'

import { EpisodeProgressControl } from '../../library/components/EpisodeProgressControl'
import { LibraryControls } from '../../library/components/LibraryControls'
import { parseTvId } from '../../tv-details/data/tvDetail'
import { parseSeasonNumber } from '../../tv-seasons/data/tvSeason'
import { EpisodeCreditsSection } from '../components/EpisodeCreditsSection'
import { EpisodeMediaSection } from '../components/EpisodeMediaSection'
import { parseEpisodeNumber } from '../data/tvEpisode'
import { useTvEpisode } from '../hooks/useTvEpisode'

import '../../movie-details/pages/MovieDetailPage.css'
import './TvEpisodePage.css'

function formatDate(
  dateValue: string | null,
): string {
  if (!dateValue) {
    return 'Date unavailable'
  }

  const date = new Date(`${dateValue}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return dateValue
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
  if (!runtime || runtime <= 0) {
    return 'Runtime unavailable'
  }

  return `${runtime} min`
}

function formatVoteCount(
  voteCount: number,
): string {
  return voteCount === 1
    ? '1 recorded vote'
    : `${voteCount.toLocaleString()} recorded votes`
}

function getCrewNames(
  crew: TmdbTvCrewMember[],
  jobs: ReadonlyArray<string>,
): string {
  const names = crew
    .filter((member) => jobs.includes(member.job))
    .map((member) => member.name)

  return [...new Set(names)].join(', ')
}

function EpisodeRouteState({
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

function EpisodeNavigationLink({
  direction,
  episode,
  seasonNumber,
  tvId,
}: {
  direction: 'next' | 'previous'
  episode: TmdbTvSeasonEpisode
  seasonNumber: number
  tvId: number
}) {
  return (
    <Link
      className={`tv-episode-nav__record tv-episode-nav__record--${direction}`}
      to={`/tv/${tvId}/season/${seasonNumber}/episode/${episode.episode_number}`}
    >
      <span>
        {direction === 'previous'
          ? '← Previous episode'
          : 'Next episode →'}
      </span>
      <strong className="font-display">
        {episode.name}
      </strong>
      <small>
        S{String(seasonNumber).padStart(2, '0')}E
        {String(episode.episode_number).padStart(2, '0')}
      </small>
    </Link>
  )
}

export function TvEpisodePage() {
  const {
    episodeNumber: routeEpisodeNumber,
    seasonNumber: routeSeasonNumber,
    tvId: routeTvId,
  } = useParams<{
    episodeNumber: string
    seasonNumber: string
    tvId: string
  }>()
  const tvId = parseTvId(routeTvId)
  const seasonNumber = parseSeasonNumber(
    routeSeasonNumber,
  )
  const episodeNumber = parseEpisodeNumber(
    routeEpisodeNumber,
  )
  const episodeRecord = useTvEpisode(
    tvId,
    seasonNumber,
    episodeNumber,
  )

  useEffect(() => {
    window.scrollTo({
      behavior: 'auto',
      top: 0,
    })
  }, [episodeNumber, seasonNumber, tvId])

  useEffect(() => {
    document.title =
      episodeRecord.series && episodeRecord.episode
        ? `${episodeRecord.series.name} — ${episodeRecord.episode.name} — CineScope`
        : 'Episode Record — CineScope'
  }, [episodeRecord.episode, episodeRecord.series])

  if (
    tvId === null ||
    seasonNumber === null ||
    episodeNumber === null
  ) {
    return (
      <EpisodeRouteState>
        <p className="archive-label">
          Record exception
        </p>
        <h1 className="movie-detail-state__title font-display">
          Invalid episode record.
        </h1>
        <p className="movie-detail-state__message">
          This episode link is not valid.
        </p>
        <Link
          className="movie-detail-state__link"
          to="/tv"
        >
          Return to TV Shows
          <span aria-hidden="true"> →</span>
        </Link>
      </EpisodeRouteState>
    )
  }

  if (episodeRecord.isPending) {
    return (
      <EpisodeRouteState>
        <LoadingState
          title="Loading episode details"
          message="Loading the episode, cast, images, and videos."
        />
      </EpisodeRouteState>
    )
  }

  if (episodeRecord.isMissing) {
    return (
      <EpisodeRouteState>
        <p className="archive-label">
          Missing record
        </p>
        <h1 className="movie-detail-state__title font-display">
          This episode could not be found.
        </h1>
        <p className="movie-detail-state__message">
          TMDB has no episode {episodeNumber} in season {seasonNumber}.
        </p>
        <Link
          className="movie-detail-state__link"
          to={`/tv/${tvId}/season/${seasonNumber}`}
        >
          Return to the season
          <span aria-hidden="true"> →</span>
        </Link>
      </EpisodeRouteState>
    )
  }

  if (episodeRecord.isError) {
    return (
      <EpisodeRouteState>
        <ErrorState
          title="Episode details could not load"
          message={
            episodeRecord.errorMessage ??
            'The episode record is temporarily unavailable.'
          }
          onRetry={episodeRecord.retry}
          retryLabel="Try again"
        />
      </EpisodeRouteState>
    )
  }

  const series = episodeRecord.series
  const season = episodeRecord.season
  const episode = episodeRecord.episode

  if (!series || !season || !episode) {
    return (
      <EpisodeRouteState>
        <p className="archive-label">
          Record unavailable
        </p>
        <h1 className="movie-detail-state__title font-display">
          No episode record was returned.
        </h1>
        <Link
          className="movie-detail-state__link"
          to={`/tv/${tvId}/season/${seasonNumber}`}
        >
          Return to the season
          <span aria-hidden="true"> →</span>
        </Link>
      </EpisodeRouteState>
    )
  }

  const stillUrl = getTmdbImageUrl(
    episode.still_path,
    'original',
  )
  const stillSrcSet = getTmdbImageSrcSet(
    episode.still_path,
    ['w500', 'w780', 'w1280'],
  )
  const crew = [
    ...episode.crew,
    ...episode.credits.crew,
  ]
  const directors = getCrewNames(crew, ['Director'])
  const writers = getCrewNames(crew, [
    'Writer',
    'Screenplay',
    'Teleplay',
    'Story',
  ])
  const sortedEpisodes = [...season.episodes].sort(
    (first, second) =>
      first.episode_number - second.episode_number,
  )
  const episodeIndex = sortedEpisodes.findIndex(
    (record) =>
      record.episode_number === episode.episode_number,
  )
  const previousEpisode =
    episodeIndex > 0
      ? sortedEpisodes[episodeIndex - 1]
      : null
  const nextEpisode =
    episodeIndex >= 0 &&
    episodeIndex < sortedEpisodes.length - 1
      ? sortedEpisodes[episodeIndex + 1]
      : null
  const scoreLabel =
    episode.vote_count > 0
      ? `${episode.vote_average.toFixed(1)} / 10`
      : 'Not yet rated'
  const seriesCandidate = {
    backdropPath: series.backdrop_path,
    id: series.id,
    mediaType: 'tv' as const,
    overview: series.overview,
    posterPath: series.poster_path,
    releaseYear:
      series.first_air_date.slice(0, 4) || null,
    title: series.name,
  }

  return (
    <article className="tv-episode-page">
      <section className="tv-episode-hero">
        {stillUrl ? (
          <img
            alt=""
            className="tv-episode-hero__still"
            decoding="async"
            fetchPriority="high"
            sizes="100vw"
            src={stillUrl}
            srcSet={stillSrcSet}
          />
        ) : null}
        <div className="tv-episode-hero__shade" />

        <div className="tv-episode-hero__inner">
          <Link
            className="tv-episode-back-link"
            to={`/tv/${series.id}/season/${season.season_number}`}
          >
            <span aria-hidden="true">←</span>
            {season.name} episodes
          </Link>

          <div className="tv-episode-hero__layout">
            <div className="tv-episode-hero__copy">
              <p className="archive-label">
                Episode record / TMDB {episode.id}
              </p>
              <p className="tv-episode-hero__series">
                {series.name} / {season.name}
              </p>
              <h1 className="font-display text-balance">
                {episode.name}
              </h1>
              <p className="tv-episode-hero__overview text-pretty">
                {episode.overview ||
                  'No synopsis is currently attached to this episode record.'}
              </p>

              <div className="tv-episode-hero__controls">
                <LibraryControls
                  candidate={seriesCandidate}
                  variant="save"
                />
                <EpisodeProgressControl
                  candidate={seriesCandidate}
                  episode={{
                    episodeNumber:
                      episode.episode_number,
                    name: episode.name,
                    seasonNumber: season.season_number,
                    stillPath: episode.still_path,
                  }}
                  nextEpisode={
                    nextEpisode
                      ? {
                          episodeNumber:
                            nextEpisode.episode_number,
                          name: nextEpisode.name,
                          seasonNumber:
                            season.season_number,
                          stillPath:
                            nextEpisode.still_path,
                        }
                      : null
                  }
                />
              </div>
            </div>

            <aside className="tv-episode-hero__index">
              <span>
                S{String(season.season_number).padStart(2, '0')}
              </span>
              <strong className="font-display">
                E{String(episode.episode_number).padStart(2, '0')}
              </strong>
              <small>
                CS / TV / {series.id} / {episode.id}
              </small>
            </aside>
          </div>

          <dl className="tv-episode-hero__facts">
            <div>
              <dt>Air date</dt>
              <dd>{formatDate(episode.air_date)}</dd>
            </div>
            <div>
              <dt>Runtime</dt>
              <dd>{formatRuntime(episode.runtime)}</dd>
            </div>
            <div>
              <dt>Audience score</dt>
              <dd>{scoreLabel}</dd>
            </div>
            <div>
              <dt>Audience volume</dt>
              <dd>{formatVoteCount(episode.vote_count)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section
        className="tv-episode-anatomy"
        aria-labelledby="episode-anatomy-heading"
      >
        <header className="tv-episode-anatomy__heading">
          <div>
            <p className="archive-label">
              Episode details
            </p>
            <h2
              className="font-display text-balance"
              id="episode-anatomy-heading"
            >
              Read the record behind the frame.
            </h2>
          </div>
          <p className="text-pretty">
            Production metadata and the credited makers
            preserved alongside the episode synopsis.
          </p>
        </header>

        <div className="tv-episode-anatomy__layout">
          <div className="tv-episode-synopsis">
            <p>Synopsis record</p>
            <blockquote className="font-display">
              {episode.overview ||
                'This episode has no recorded synopsis.'}
            </blockquote>
          </div>

          <dl className="tv-episode-anatomy__facts">
            <div>
              <dt>Directed by</dt>
              <dd>{directors || 'Not indexed'}</dd>
            </div>
            <div>
              <dt>Written by</dt>
              <dd>{writers || 'Not indexed'}</dd>
            </div>
            <div>
              <dt>Production code</dt>
              <dd>
                {episode.production_code ||
                  'Not indexed'}
              </dd>
            </div>
            <div>
              <dt>Guest cast</dt>
              <dd>
                {episode.credits.guest_stars.length.toLocaleString()}{' '}
                credited
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <EpisodeMediaSection episode={episode} />
      <EpisodeCreditsSection episode={episode} />

      <nav
        className="tv-episode-nav"
        aria-label="Adjacent episodes"
      >
        <div className="tv-episode-nav__heading">
          <p className="archive-label">
            Continue the season
          </p>
          <Link
            to={`/tv/${series.id}/season/${season.season_number}`}
          >
            All episodes →
          </Link>
        </div>

        <div className="tv-episode-nav__grid">
          {previousEpisode ? (
            <EpisodeNavigationLink
              direction="previous"
              episode={previousEpisode}
              seasonNumber={season.season_number}
              tvId={series.id}
            />
          ) : (
            <div className="tv-episode-nav__boundary">
              <span>Beginning of season</span>
            </div>
          )}

          {nextEpisode ? (
            <EpisodeNavigationLink
              direction="next"
              episode={nextEpisode}
              seasonNumber={season.season_number}
              tvId={series.id}
            />
          ) : (
            <div className="tv-episode-nav__boundary tv-episode-nav__boundary--next">
              <span>End of season</span>
            </div>
          )}
        </div>
      </nav>
    </article>
  )
}
