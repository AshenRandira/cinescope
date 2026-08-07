import { useEffect } from 'react'
import { Link, useParams } from 'react-router'

import {
  ErrorState,
  LoadingState,
} from '../../../components/feedback'
import {
  getTmdbBackdropUrl,
  getTmdbImageSrcSet,
  getTmdbImageUrl,
  getTmdbPosterUrl,
  getTmdbProfileUrl,
} from '../../../lib/tmdb/image'

import type {
  TmdbTvSeasonEpisode,
} from '../../../types/tmdb'

import { LibraryControls } from '../../library/components/LibraryControls'
import { parseTvId } from '../../tv-details/data/tvDetail'
import { parseSeasonNumber } from '../data/tvSeason'
import { useTvSeason } from '../hooks/useTvSeason'

import '../../movie-details/pages/MovieDetailPage.css'
import './TvSeasonPage.css'

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

function formatScore(
  voteAverage: number,
  voteCount: number,
): string {
  if (voteCount <= 0) {
    return 'Not yet rated'
  }

  return `${voteAverage.toFixed(1)} / 10`
}

function getCrewNames(
  episode: TmdbTvSeasonEpisode,
  jobs: ReadonlyArray<string>,
): string {
  const names = episode.crew
    .filter((member) => jobs.includes(member.job))
    .map((member) => member.name)

  return [...new Set(names)].join(', ')
}

function getInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return initials || 'CS'
}

function SeasonRouteState({
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

export function TvSeasonPage() {
  const {
    seasonNumber: routeSeasonNumber,
    tvId: routeTvId,
  } = useParams<{
    seasonNumber: string
    tvId: string
  }>()
  const tvId = parseTvId(routeTvId)
  const seasonNumber = parseSeasonNumber(
    routeSeasonNumber,
  )
  const seasonRecord = useTvSeason(
    tvId,
    seasonNumber,
  )

  useEffect(() => {
    window.scrollTo({
      behavior: 'auto',
      top: 0,
    })
  }, [seasonNumber, tvId])

  useEffect(() => {
    document.title =
      seasonRecord.series && seasonRecord.season
        ? `${seasonRecord.series.name} — ${seasonRecord.season.name} — CineScope`
      : 'Season Record — CineScope'
  }, [seasonRecord.season, seasonRecord.series])

  useEffect(() => {
    if (
      !seasonRecord.season ||
      !window.location.hash
    ) {
      return
    }

    const targetId = decodeURIComponent(
      window.location.hash.slice(1),
    )
    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(targetId)
        ?.scrollIntoView({ block: 'start' })
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [seasonRecord.season])

  if (tvId === null || seasonNumber === null) {
    return (
      <SeasonRouteState>
        <p className="archive-label">
          Record exception
        </p>
        <h1 className="movie-detail-state__title font-display">
          Invalid season record.
        </h1>
        <p className="movie-detail-state__message">
          The requested route does not contain a valid
          TMDB series and season identifier.
        </p>
        <Link
          className="movie-detail-state__link"
          to="/tv"
        >
          Return to the television register
          <span aria-hidden="true"> →</span>
        </Link>
      </SeasonRouteState>
    )
  }

  if (seasonRecord.isPending) {
    return (
      <SeasonRouteState>
        <LoadingState
          title="Rewinding the season record"
          message="Retrieving the season, episode register, and credited personnel."
        />
      </SeasonRouteState>
    )
  }

  if (seasonRecord.isMissing) {
    return (
      <SeasonRouteState>
        <p className="archive-label">
          Missing record
        </p>
        <h1 className="movie-detail-state__title font-display">
          This season could not be found.
        </h1>
        <p className="movie-detail-state__message">
          TMDB does not currently contain season{' '}
          {seasonNumber} for series identifier {tvId}.
        </p>
        <Link
          className="movie-detail-state__link"
          to={`/tv/${tvId}`}
        >
          Return to the series record
          <span aria-hidden="true"> →</span>
        </Link>
      </SeasonRouteState>
    )
  }

  if (seasonRecord.isError) {
    return (
      <SeasonRouteState>
        <ErrorState
          title="The season record could not be tuned"
          message={
            seasonRecord.errorMessage ??
            'The season record is temporarily unavailable.'
          }
          onRetry={seasonRecord.retry}
          retryLabel="Retry season record"
        />
      </SeasonRouteState>
    )
  }

  const series = seasonRecord.series
  const season = seasonRecord.season

  if (!series || !season) {
    return (
      <SeasonRouteState>
        <p className="archive-label">
          Record unavailable
        </p>
        <h1 className="movie-detail-state__title font-display">
          No season record was returned.
        </h1>
        <Link
          className="movie-detail-state__link"
          to={`/tv/${tvId}`}
        >
          Return to the series record
          <span aria-hidden="true"> →</span>
        </Link>
      </SeasonRouteState>
    )
  }

  const backdropUrl = getTmdbBackdropUrl(
    series.backdrop_path,
    'original',
  )
  const seasonPosterUrl = getTmdbPosterUrl(
    season.poster_path,
    'w780',
  )
  const seasonPosterSrcSet = getTmdbImageSrcSet(
    season.poster_path,
    ['w342', 'w500', 'w780'],
  )
  const episodes = [...season.episodes].sort(
    (first, second) =>
      first.episode_number - second.episode_number,
  )
  const cast = season.credits.cast.slice(0, 8)
  const seasonLabel =
    season.season_number === 0
      ? 'Special transmissions'
      : `Season ${season.season_number}`

  return (
    <article className="tv-season-page">
      <section className="tv-season-hero">
        {backdropUrl ? (
          <img
            alt=""
            className="tv-season-hero__backdrop"
            decoding="async"
            fetchPriority="high"
            src={backdropUrl}
          />
        ) : null}

        <div className="tv-season-hero__shade" />

        <div className="tv-season-hero__inner">
          <Link
            className="tv-season-back-link"
            to={`/tv/${series.id}`}
          >
            <span aria-hidden="true">←</span>
            {series.name} record
          </Link>

          <div className="tv-season-hero__layout">
            <div className="tv-season-hero__copy">
              <p className="archive-label">
                Season record / TMDB {season.id}
              </p>
              <p className="tv-season-hero__series">
                {series.name}
              </p>
              <h1 className="font-display text-balance">
                {season.name}
              </h1>
              <p className="tv-season-hero__overview text-pretty">
                {season.overview ||
                  `The episode register for ${seasonLabel.toLowerCase()} is preserved below.`}
              </p>

              <div className="tv-season-hero__controls">
                <LibraryControls
                  candidate={{
                    backdropPath: series.backdrop_path,
                    id: series.id,
                    mediaType: 'tv',
                    overview: series.overview,
                    posterPath: series.poster_path,
                    releaseYear:
                      series.first_air_date.slice(0, 4) ||
                      null,
                    title: series.name,
                  }}
                  variant="save"
                />
              </div>

              <dl className="tv-season-hero__facts">
                <div>
                  <dt>Transmission</dt>
                  <dd>{formatDate(season.air_date)}</dd>
                </div>
                <div>
                  <dt>Episode register</dt>
                  <dd>
                    {episodes.length.toLocaleString()}{' '}
                    {episodes.length === 1
                      ? 'episode'
                      : 'episodes'}
                  </dd>
                </div>
                <div>
                  <dt>Season score</dt>
                  <dd>
                    {Number.isFinite(season.vote_average) &&
                    season.vote_average > 0
                      ? `${season.vote_average.toFixed(1)} / 10`
                      : 'Not yet rated'}
                  </dd>
                </div>
              </dl>
            </div>

            <aside className="tv-season-hero__poster">
              {seasonPosterUrl ? (
                <img
                  alt={`${season.name} poster`}
                  decoding="async"
                  sizes="(max-width: 48rem) 42vw, 22vw"
                  src={seasonPosterUrl}
                  srcSet={seasonPosterSrcSet}
                />
              ) : (
                <div className="tv-season-hero__poster-fallback">
                  <span>
                    {String(season.season_number).padStart(
                      2,
                      '0',
                    )}
                  </span>
                  <small>Artwork unavailable</small>
                </div>
              )}
              <span>CS / TV / {series.id} / S{season.season_number}</span>
            </aside>
          </div>
        </div>
      </section>

      <section
        className="tv-season-episodes"
        aria-labelledby="season-episodes-heading"
      >
        <header className="tv-season-section-heading">
          <div>
            <p className="archive-label">
              02 / Episode register
            </p>
            <h2
              className="font-display text-balance"
              id="season-episodes-heading"
            >
              Read the season frame by frame.
            </h2>
          </div>
          <p className="text-pretty">
            Air dates, runtimes, credited makers, guest
            performers, and synopsis records supplied by
            TMDB for this season.
          </p>
        </header>

        {episodes.length > 0 ? (
          <ol className="tv-episode-list">
            {episodes.map((episode) => {
              const stillUrl = getTmdbImageUrl(
                episode.still_path,
                'w780',
              )
              const stillSrcSet =
                getTmdbImageSrcSet(
                  episode.still_path,
                  ['w300', 'w500', 'w780'],
                )
              const directors = getCrewNames(
                episode,
                ['Director'],
              )
              const writers = getCrewNames(
                episode,
                [
                  'Writer',
                  'Screenplay',
                  'Teleplay',
                  'Story',
                ],
              )

              return (
                <li
                  className="tv-episode-card"
                  id={`episode-${episode.episode_number}`}
                  key={episode.id}
                >
                  <div className="tv-episode-card__artwork">
                    {stillUrl ? (
                      <img
                        alt=""
                        decoding="async"
                        loading="lazy"
                        sizes="(max-width: 48rem) 100vw, 42vw"
                        src={stillUrl}
                        srcSet={stillSrcSet}
                      />
                    ) : (
                      <div className="tv-episode-card__fallback">
                        <span>
                          E{String(
                            episode.episode_number,
                          ).padStart(2, '0')}
                        </span>
                        <small>Still unavailable</small>
                      </div>
                    )}
                    <span className="tv-episode-card__number">
                      S{String(season.season_number).padStart(2, '0')}
                      E{String(episode.episode_number).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="tv-episode-card__copy">
                    <div className="tv-episode-card__heading">
                      <div>
                        <p>
                          Episode {episode.episode_number}
                        </p>
                        <h3 className="font-display">
                          {episode.name}
                        </h3>
                      </div>
                      <span>
                        {formatScore(
                          episode.vote_average,
                          episode.vote_count,
                        )}
                      </span>
                    </div>

                    <p className="tv-episode-card__metadata">
                      {formatDate(episode.air_date)}
                      <span aria-hidden="true"> / </span>
                      {formatRuntime(episode.runtime)}
                    </p>

                    <p className="tv-episode-card__overview text-pretty">
                      {episode.overview ||
                        'No synopsis is currently attached to this episode record.'}
                    </p>

                    <dl className="tv-episode-card__credits">
                      <div>
                        <dt>Directed by</dt>
                        <dd>{directors || 'Not indexed'}</dd>
                      </div>
                      <div>
                        <dt>Written by</dt>
                        <dd>{writers || 'Not indexed'}</dd>
                      </div>
                      <div>
                        <dt>Guest register</dt>
                        <dd>
                          {episode.guest_stars.length > 0
                            ? `${episode.guest_stars.length} credited`
                            : 'No guest credits'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </li>
              )
            })}
          </ol>
        ) : (
          <div className="tv-season-empty">
            <p>Catalogue boundary</p>
            <h3 className="font-display">
              No episode records were returned.
            </h3>
          </div>
        )}
      </section>

      <section
        className="tv-season-cast"
        aria-labelledby="season-cast-heading"
      >
        <header className="tv-season-section-heading">
          <div>
            <p className="archive-label">
              03 / Season personnel
            </p>
            <h2
              className="font-display text-balance"
              id="season-cast-heading"
            >
              The ensemble attached to this transmission.
            </h2>
          </div>
          <p className="text-pretty">
            Principal season credits in recorded order.
          </p>
        </header>

        {cast.length > 0 ? (
          <ul className="tv-season-cast__grid">
            {cast.map((member, index) => {
              const profileUrl = getTmdbProfileUrl(
                member.profile_path,
                'w342',
              )
              const profileSrcSet =
                getTmdbImageSrcSet(
                  member.profile_path,
                  ['w185', 'w342'],
                )

              return (
                <li key={member.credit_id}>
                  <div className="tv-season-cast__portrait">
                    {profileUrl ? (
                      <img
                        alt={`${member.name} portrait`}
                        decoding="async"
                        loading="lazy"
                        sizes="(max-width: 40rem) 45vw, (max-width: 64rem) 24vw, 13vw"
                        src={profileUrl}
                        srcSet={profileSrcSet}
                      />
                    ) : (
                      <span aria-hidden="true">
                        {getInitials(member.name)}
                      </span>
                    )}
                    <small>
                      {String(index + 1).padStart(2, '0')}
                    </small>
                  </div>
                  <h3>{member.name}</h3>
                  <p>
                    {member.character ||
                      'Role unavailable'}
                  </p>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="tv-season-cast__empty">
            Season-level cast credits are not available.
          </p>
        )}
      </section>

      <footer className="tv-season-return">
        <p>End of season record</p>
        <Link to={`/tv/${series.id}`}>
          Return to {series.name}
          <span aria-hidden="true"> →</span>
        </Link>
      </footer>
    </article>
  )
}
