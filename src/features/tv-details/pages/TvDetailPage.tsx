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
  getTmdbProfileUrl,
} from '../../../lib/tmdb/image'

import { LibraryControls } from '../../library/components/LibraryControls'
import { MovieAvailabilitySection } from '../../movie-details/components/MovieAvailabilitySection'

import { TvRecommendationsSection } from '../components/TvRecommendationsSection'
import { TvVideoSection } from '../components/TvVideoSection'
import { parseTvId } from '../data/tvDetail'
import { useTvDetail } from '../hooks/useTvDetail'

import '../../movie-details/pages/MovieDetailPage.css'
import '../../movie-details/components/MovieDetailSections.css'
import './TvDetailPage.css'

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

function formatEpisodeRuntime(
  runtimes: number[],
): string {
  const validRuntimes = runtimes.filter(
    (runtime) =>
      Number.isFinite(runtime) && runtime > 0,
  )

  if (validRuntimes.length === 0) {
    return 'Runtime unavailable'
  }

  if (validRuntimes.length === 1) {
    return `${validRuntimes[0]} min episodes`
  }

  return `${Math.min(...validRuntimes)}–${Math.max(...validRuntimes)} min episodes`
}

function formatVoteCount(
  voteCount: number,
): string {
  return voteCount === 1
    ? '1 recorded vote'
    : `${voteCount.toLocaleString()} recorded votes`
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

function TvDetailRouteState({
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

export function TvDetailPage() {
  const { tvId: routeTvId } = useParams<{
    tvId: string
  }>()
  const tvId = parseTvId(routeTvId)
  const { details, watchProviders } =
    useTvDetail(tvId)

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'auto',
    })
  }, [tvId])

  useEffect(() => {
    document.title = details.data
      ? `${details.data.name} — CineScope`
      : 'Series Record — CineScope'
  }, [details.data])

  if (tvId === null) {
    return (
      <TvDetailRouteState>
        <p className="archive-label">
          Record exception
        </p>
        <h1 className="movie-detail-state__title font-display">
          Invalid television record.
        </h1>
        <p className="movie-detail-state__message">
          The requested route does not contain a valid
          TMDB series identifier.
        </p>
        <Link
          className="movie-detail-state__link"
          to="/tv"
        >
          Return to the television register
          <span aria-hidden="true"> →</span>
        </Link>
      </TvDetailRouteState>
    )
  }

  if (details.isPending) {
    return (
      <TvDetailRouteState>
        <LoadingState
          title="Tuning the series record"
          message="Retrieving the series, seasons, credits, videos, and related catalogue material."
        />
      </TvDetailRouteState>
    )
  }

  if (details.isMissing) {
    return (
      <TvDetailRouteState>
        <p className="archive-label">
          Missing record
        </p>
        <h1 className="movie-detail-state__title font-display">
          This series could not be found.
        </h1>
        <p className="movie-detail-state__message">
          TMDB does not currently contain a television
          record for identifier {tvId}.
        </p>
        <Link
          className="movie-detail-state__link"
          to="/tv"
        >
          Return to the television register
          <span aria-hidden="true"> →</span>
        </Link>
      </TvDetailRouteState>
    )
  }

  if (details.isError) {
    return (
      <TvDetailRouteState>
        <ErrorState
          title="The series record could not be tuned"
          message={
            details.errorMessage ??
            'The television record is temporarily unavailable.'
          }
          onRetry={details.retry}
          retryLabel="Retry series record"
        />
      </TvDetailRouteState>
    )
  }

  const show = details.data

  if (!show) {
    return (
      <TvDetailRouteState>
        <p className="archive-label">
          Record unavailable
        </p>
        <h1 className="movie-detail-state__title font-display">
          No series record was returned.
        </h1>
        <p className="movie-detail-state__message">
          Return to the register and select another
          transmission.
        </p>
        <Link
          className="movie-detail-state__link"
          to="/tv"
        >
          Return to the television register
          <span aria-hidden="true"> →</span>
        </Link>
      </TvDetailRouteState>
    )
  }

  const backdropUrl = getTmdbBackdropUrl(
    show.backdrop_path,
    'original',
  )
  const posterUrl = getTmdbPosterUrl(
    show.poster_path,
    'w780',
  )
  const heroImageUrl = backdropUrl ?? posterUrl
  const heroImageSrcSet = backdropUrl
    ? getTmdbImageSrcSet(
        show.backdrop_path,
        ['w780', 'w1280'],
      )
    : getTmdbImageSrcSet(
        show.poster_path,
        ['w500', 'w780'],
      )
  const posterSrcSet = getTmdbImageSrcSet(
    show.poster_path,
    ['w342', 'w500', 'w780'],
  )
  const firstAirYear = show.first_air_date
    ? show.first_air_date.slice(0, 4)
    : null
  const lastAirYear = show.last_air_date
    ? show.last_air_date.slice(0, 4)
    : null
  const runLabel = firstAirYear
    ? `${firstAirYear}–${
        show.in_production
          ? 'Present'
          : lastAirYear ?? firstAirYear
      }`
    : 'Air dates unavailable'
  const genreLabel =
    show.genres.map((genre) => genre.name).join(' / ') ||
    'Genre unavailable'
  const scoreLabel =
    show.vote_count > 0
      ? show.vote_average.toFixed(1)
      : '—'
  const creators =
    show.created_by.map((creator) => creator.name).join(', ') ||
    'Creator record unavailable'
  const networks =
    show.networks.map((network) => network.name).join(', ') ||
    'Network record unavailable'
  const productionCompanies =
    show.production_companies
      .map((company) => company.name)
      .join(', ') || 'Production record unavailable'
  const productionCountries =
    show.production_countries
      .map((country) => country.name)
      .join(', ') ||
    show.origin_country.join(', ') ||
    'Territory unavailable'
  const spokenLanguages =
    show.spoken_languages
      .map((language) => language.english_name)
      .join(', ') || 'Language record unavailable'
  const seasons = [...show.seasons].sort(
    (first, second) =>
      first.season_number - second.season_number,
  )
  const cast = show.credits.cast.slice(0, 10)

  return (
    <article className="movie-detail-page tv-detail-page">
      <section
        className={[
          'movie-detail-hero',
          heroImageUrl
            ? ''
            : 'movie-detail-hero--without-artwork',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-labelledby="tv-detail-title"
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
            to="/tv"
          >
            <span aria-hidden="true">←</span>
            Television register
          </Link>

          <div className="movie-detail-hero__layout">
            <div className="movie-detail-hero__copy">
              <p className="archive-label">
                Series record / TMDB {show.id}
              </p>

              <h1
                className="movie-detail-hero__title font-display text-balance"
                id="tv-detail-title"
              >
                {show.name}
              </h1>

              {show.tagline ? (
                <p className="movie-detail-hero__tagline text-pretty">
                  {show.tagline}
                </p>
              ) : null}

              <ul
                className="movie-detail-hero__index"
                aria-label="Series summary"
              >
                <li>{runLabel}</li>
                <li>
                  {show.number_of_seasons.toLocaleString()}{' '}
                  {show.number_of_seasons === 1
                    ? 'season'
                    : 'seasons'}
                </li>
                <li>{show.status || 'Status unavailable'}</li>
              </ul>

              <p className="movie-detail-hero__genres">
                {genreLabel}
              </p>

              <p className="movie-detail-hero__overview text-pretty">
                {show.overview ||
                  'This series record does not yet include an overview.'}
              </p>

              <LibraryControls
                candidate={{
                  backdropPath: show.backdrop_path,
                  id: show.id,
                  mediaType: 'tv',
                  overview: show.overview || null,
                  posterPath: show.poster_path,
                  releaseYear: firstAirYear,
                  title: show.name,
                }}
              />

              <dl className="movie-detail-hero__ratings">
                <div>
                  <dt>TMDB user score</dt>
                  <dd>
                    {scoreLabel}
                    {show.vote_count > 0 ? (
                      <span> / 10</span>
                    ) : null}
                  </dd>
                </div>

                <div>
                  <dt>Audience volume</dt>
                  <dd>{formatVoteCount(show.vote_count)}</dd>
                </div>

                <div>
                  <dt>
                    {show.next_episode_to_air
                      ? 'Next transmission'
                      : 'Latest transmission'}
                  </dt>
                  <dd>
                    {formatDate(
                      show.next_episode_to_air?.air_date ??
                        show.last_air_date,
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            <aside
              className="movie-detail-hero__poster-frame"
              aria-label={`${show.name} poster`}
            >
              {posterUrl ? (
                <img
                  alt={`${show.name} poster`}
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
                CS / TV / {show.id}
              </span>
            </aside>
          </div>
        </div>
      </section>

      <TvVideoSection show={show} />

      <div className="movie-detail-sections">
        <section
          className="movie-detail-record"
          aria-labelledby="tv-record-heading"
        >
          <header className="movie-detail-section-heading">
            <div>
              <p className="archive-label">
                03 / Signal anatomy
              </p>
              <h2
                className="movie-detail-section-heading__title font-display text-balance"
                id="tv-record-heading"
              >
                The catalogue facts behind the broadcast.
              </h2>
            </div>
            <p className="movie-detail-section-heading__copy text-pretty">
              Air dates, episode volume, language, and
              production information preserved from this
              TMDB series record.
            </p>
          </header>

          <div className="movie-detail-record__layout">
            <dl className="movie-detail-fact-grid">
              <div>
                <dt>First transmission</dt>
                <dd>{formatDate(show.first_air_date)}</dd>
              </div>
              <div>
                <dt>Latest transmission</dt>
                <dd>{formatDate(show.last_air_date)}</dd>
              </div>
              <div>
                <dt>Episode runtime</dt>
                <dd>
                  {formatEpisodeRuntime(
                    show.episode_run_time,
                  )}
                </dd>
              </div>
              <div>
                <dt>Episode register</dt>
                <dd>
                  {show.number_of_episodes.toLocaleString()}{' '}
                  episodes
                </dd>
              </div>
              <div>
                <dt>Series type</dt>
                <dd>{show.type || 'Type unavailable'}</dd>
              </div>
              <div>
                <dt>Production state</dt>
                <dd>
                  {show.in_production
                    ? 'In production'
                    : show.status || 'Status unavailable'}
                </dd>
              </div>
            </dl>

            <aside
              className="movie-detail-archive-notes"
              aria-label="Additional series notes"
            >
              <div>
                <h3>Created by</h3>
                <p>{creators}</p>
              </div>
              <div>
                <h3>Networks</h3>
                <p>{networks}</p>
              </div>
              <div>
                <h3>Original title</h3>
                <p>{show.original_name || show.name}</p>
              </div>
              <div>
                <h3>Spoken languages</h3>
                <p>{spokenLanguages}</p>
              </div>
              <div>
                <h3>Production territories</h3>
                <p>{productionCountries}</p>
              </div>
              <div>
                <h3>Production companies</h3>
                <p>{productionCompanies}</p>
              </div>
            </aside>
          </div>

          {show.next_episode_to_air ? (
            <Link
              aria-label={`Open ${show.next_episode_to_air.name} in the season register`}
              className="tv-detail-next-episode"
              to={`/tv/${show.id}/season/${show.next_episode_to_air.season_number}#episode-${show.next_episode_to_air.episode_number}`}
            >
              <p>Next episode indexed</p>
              <h3 className="font-display">
                {show.next_episode_to_air.name}
              </h3>
              <span>
                Season {show.next_episode_to_air.season_number},{' '}
                episode {show.next_episode_to_air.episode_number}{' '}
                / {formatDate(show.next_episode_to_air.air_date)}
              </span>
            </Link>
          ) : null}
        </section>

        <section
          className="tv-detail-seasons"
          aria-labelledby="tv-seasons-heading"
        >
          <header className="movie-detail-section-heading">
            <div>
              <p className="archive-label">
                04 / Season register
              </p>
              <h2
                className="movie-detail-section-heading__title font-display text-balance"
                id="tv-seasons-heading"
              >
                Follow the transmission across seasons.
              </h2>
            </div>
            <p className="movie-detail-section-heading__copy text-pretty">
              Season-level catalogue records, including
              specials where TMDB has indexed them.
            </p>
          </header>

          {seasons.length > 0 ? (
            <ol className="tv-season-grid">
              {seasons.map((season, index) => {
                const seasonPosterUrl =
                  getTmdbPosterUrl(
                    season.poster_path,
                    'w500',
                  )
                const seasonPosterSrcSet =
                  getTmdbImageSrcSet(
                    season.poster_path,
                    ['w185', 'w342', 'w500'],
                  )

                return (
                  <li key={season.id}>
                    <Link
                      aria-label={`Open ${season.name} episode register`}
                      className="tv-season-card"
                      to={`/tv/${show.id}/season/${season.season_number}`}
                    >
                      <div className="tv-season-card__artwork">
                        {seasonPosterUrl ? (
                          <img
                            alt={`${season.name} poster`}
                            decoding="async"
                            loading="lazy"
                            sizes="(max-width: 40rem) 34vw, (max-width: 64rem) 24vw, 14vw"
                            src={seasonPosterUrl}
                            srcSet={seasonPosterSrcSet}
                          />
                        ) : (
                          <span aria-hidden="true">
                            {String(
                              season.season_number,
                            ).padStart(2, '0')}
                          </span>
                        )}
                        <small>
                          {String(index + 1).padStart(2, '0')}
                        </small>
                      </div>

                      <div className="tv-season-card__copy">
                        <p>
                          {season.season_number === 0
                            ? 'Special transmission'
                            : `Season ${season.season_number}`}
                        </p>
                        <h3 className="font-display">
                          {season.name}
                        </h3>
                        <span className="tv-season-card__metadata">
                          {season.episode_count.toLocaleString()}{' '}
                          {season.episode_count === 1
                            ? 'episode'
                            : 'episodes'}
                          {' / '}
                          {formatDate(season.air_date)}
                        </span>
                        <p className="tv-season-card__overview text-pretty">
                          {season.overview ||
                            'No season overview is currently attached to this record.'}
                        </p>
                        <span className="tv-season-card__action">
                          Open episode register
                          <span aria-hidden="true"> →</span>
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ol>
          ) : (
            <p className="movie-detail-section-empty">
              No season records are currently available.
            </p>
          )}
        </section>

        <section
          className="movie-detail-credits"
          aria-labelledby="tv-credits-heading"
        >
          <header className="movie-detail-section-heading">
            <div>
              <p className="archive-label">
                05 / Credits register
              </p>
              <h2
                className="movie-detail-section-heading__title font-display text-balance"
                id="tv-credits-heading"
              >
                The people recorded around the series.
              </h2>
            </div>
            <p className="movie-detail-section-heading__copy text-pretty">
              Principal cast from the available TMDB
              television credits, accompanied by the
              production signals behind the record.
            </p>
          </header>

          <div className="movie-detail-credits__layout">
            <aside
              className="movie-detail-key-crew"
              aria-labelledby="tv-production-register-heading"
            >
              <p className="movie-detail-subsection-index">
                Production register
              </p>
              <h3
                className="movie-detail-subsection-title font-display"
                id="tv-production-register-heading"
              >
                Signal origins
              </h3>
              <dl className="movie-detail-key-crew__list">
                <div>
                  <dt>Creators</dt>
                  <dd>{creators}</dd>
                </div>
                <div>
                  <dt>Networks</dt>
                  <dd>{networks}</dd>
                </div>
                <div>
                  <dt>Production</dt>
                  <dd>{productionCompanies}</dd>
                </div>
              </dl>
            </aside>

            <div
              className="movie-detail-cast"
              aria-labelledby="tv-cast-heading"
            >
              <div className="movie-detail-cast__heading">
                <div>
                  <p className="movie-detail-subsection-index">
                    Credited order
                  </p>
                  <h3
                    className="movie-detail-subsection-title font-display"
                    id="tv-cast-heading"
                  >
                    Principal cast
                  </h3>
                </div>
                <p>
                  {cast.length > 0
                    ? `${cast.length} performers projected`
                    : 'No cast records available'}
                </p>
              </div>

              {cast.length > 0 ? (
                <ul className="movie-detail-cast__grid">
                  {cast.map((member, index) => {
                    const profileUrl =
                      getTmdbProfileUrl(
                        member.profile_path,
                        'w342',
                      )
                    const profileSrcSet =
                      getTmdbImageSrcSet(
                        member.profile_path,
                        ['w185', 'w342'],
                      )

                    return (
                      <li
                        className="movie-detail-cast-card"
                        key={member.credit_id}
                      >
                        <div className="movie-detail-cast-card__portrait">
                          {profileUrl ? (
                            <img
                              alt={`${member.name} portrait`}
                              decoding="async"
                              loading="lazy"
                              sizes="(max-width: 40rem) 30vw, (max-width: 64rem) 20vw, 12vw"
                              src={profileUrl}
                              srcSet={profileSrcSet}
                            />
                          ) : (
                            <div
                              className="movie-detail-cast-card__fallback"
                              aria-hidden="true"
                            >
                              <span>
                                {getInitials(member.name)}
                              </span>
                            </div>
                          )}
                          <span className="movie-detail-cast-card__number">
                            {String(index + 1).padStart(
                              2,
                              '0',
                            )}
                          </span>
                        </div>
                        <div className="movie-detail-cast-card__caption">
                          <h4>{member.name}</h4>
                          <p>
                            {member.character ||
                              'Role unavailable'}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="movie-detail-section-empty">
                  Cast information is not available for
                  this record.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      <MovieAvailabilitySection
        mediaKind="series"
        movieTitle={show.name}
        sectionIndex="06"
        watchProviders={watchProviders}
      />

      <TvRecommendationsSection show={show} />
    </article>
  )
}
