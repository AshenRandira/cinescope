import { Link } from 'react-router'

import {
  getTmdbImageSrcSet,
  getTmdbPosterUrl,
} from '../../../lib/tmdb/image'

import type {
  TmdbPersonCombinedCredit,
  TmdbPersonDetails,
} from '../../../types/tmdb'

import './PersonCreditsSection.css'

function getCreditTitle(
  credit: TmdbPersonCombinedCredit,
): string {
  return (
    credit.title ??
    credit.name ??
    credit.original_title ??
    credit.original_name ??
    'Untitled record'
  )
}

function getCreditDate(
  credit: TmdbPersonCombinedCredit,
): string {
  return credit.release_date ?? credit.first_air_date ?? ''
}

function getCreditYear(
  credit: TmdbPersonCombinedCredit,
): string {
  const year = getCreditDate(credit).slice(0, 4)

  return /^\d{4}$/.test(year) ? year : 'Undated'
}

function getCreditRole(
  credit: TmdbPersonCombinedCredit,
): string {
  return (
    credit.character ||
    credit.job ||
    credit.department ||
    'Credit indexed'
  )
}

function getCreditTarget(
  credit: TmdbPersonCombinedCredit,
): string {
  return credit.media_type === 'movie'
    ? `/movies/${credit.id}`
    : `/tv/${credit.id}`
}

function getUniqueCredits(
  person: TmdbPersonDetails,
): TmdbPersonCombinedCredit[] {
  const recordedKeys = new Set<string>()
  const credits: TmdbPersonCombinedCredit[] = []
  const isKnownForActing =
    person.known_for_department === 'Acting'
  const orderedCredits = isKnownForActing
    ? [
        ...person.combined_credits.cast,
        ...person.combined_credits.crew,
      ]
    : [
        ...person.combined_credits.crew,
        ...person.combined_credits.cast,
      ]

  for (const credit of orderedCredits) {
    if (credit.adult) {
      continue
    }

    const key = `${credit.media_type}:${credit.id}`

    if (recordedKeys.has(key)) {
      continue
    }

    recordedKeys.add(key)
    credits.push(credit)
  }

  return credits
}

function getSelectedCredits(
  person: TmdbPersonDetails,
  credits: TmdbPersonCombinedCredit[],
): TmdbPersonCombinedCredit[] {
  const isKnownForActing =
    person.known_for_department === 'Acting'

  function isPreferredCredit(
    credit: TmdbPersonCombinedCredit,
  ): boolean {
    if (isKnownForActing) {
      return Boolean(credit.character)
    }

    return (
      credit.department === person.known_for_department
    )
  }

  return [...credits]
    .sort(
      (first, second) =>
        Number(isPreferredCredit(second)) -
          Number(isPreferredCredit(first)) ||
        second.popularity - first.popularity ||
        second.vote_count - first.vote_count,
    )
    .slice(0, 12)
}

function getChronologyCredits(
  credits: TmdbPersonCombinedCredit[],
): TmdbPersonCombinedCredit[] {
  return [...credits]
    .sort(
      (first, second) =>
        getCreditDate(second).localeCompare(
          getCreditDate(first),
        ) || second.popularity - first.popularity,
    )
    .slice(0, 24)
}

export function PersonCreditsSection({
  person,
}: {
  person: TmdbPersonDetails
}) {
  const credits = getUniqueCredits(person)
  const selectedCredits = getSelectedCredits(
    person,
    credits,
  )
  const chronologyCredits = getChronologyCredits(credits)

  return (
    <section
      className="person-credits"
      aria-labelledby="person-credits-heading"
    >
      <header className="person-section-heading">
        <div>
          <p className="archive-label">
            03 / Combined credits
          </p>
          <h2
            className="font-display text-balance"
            id="person-credits-heading"
          >
            Follow the work across screens.
          </h2>
        </div>
        <p className="text-pretty">
          Movie and TV credits from TMDB, starting with the contributor&apos;s best-known work.
        </p>
      </header>

      {selectedCredits.length > 0 ? (
        <ul className="person-credit-grid">
          {selectedCredits.map((credit, index) => {
            const title = getCreditTitle(credit)
            const posterUrl = getTmdbPosterUrl(
              credit.poster_path,
              'w500',
            )
            const posterSrcSet = getTmdbImageSrcSet(
              credit.poster_path,
              ['w185', 'w342', 'w500'],
            )

            return (
              <li key={`${credit.media_type}:${credit.id}`}>
                <Link
                  aria-label={`View ${credit.media_type === 'movie' ? 'movie' : 'series'} details for ${title}`}
                  className="person-credit-card"
                  to={getCreditTarget(credit)}
                >
                  <div className="person-credit-card__artwork">
                    {posterUrl ? (
                      <img
                        alt=""
                        decoding="async"
                        loading="lazy"
                        sizes="(max-width: 40rem) 45vw, (max-width: 64rem) 30vw, 18vw"
                        src={posterUrl}
                        srcSet={posterSrcSet}
                      />
                    ) : (
                      <span>
                        {title.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <small>
                      {String(index + 1).padStart(2, '0')}
                    </small>
                  </div>
                  <div className="person-credit-card__copy">
                    <p>
                      {credit.media_type === 'movie'
                        ? 'Film'
                        : 'Television'}{' '}
                      / {getCreditYear(credit)}
                    </p>
                    <h3 className="font-display">
                      {title}
                    </h3>
                    <span>{getCreditRole(credit)}</span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="person-credits__empty">
          No combined credits are attached to this
          contributor record.
        </p>
      )}

      {chronologyCredits.length > 0 ? (
        <div className="person-chronology">
          <div className="person-chronology__heading">
            <div>
              <p>Filmography</p>
              <h3 className="font-display">
                Recent recorded work
              </h3>
            </div>
            <span>
              {chronologyCredits.length} of{' '}
              {credits.length} unique records
            </span>
          </div>

          <ol>
            {chronologyCredits.map((credit, index) => (
              <li
                key={`${credit.media_type}:${credit.id}`}
              >
                <Link to={getCreditTarget(credit)}>
                  <span>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <time dateTime={getCreditDate(credit)}>
                    {getCreditYear(credit)}
                  </time>
                  <strong>{getCreditTitle(credit)}</strong>
                  <small>{getCreditRole(credit)}</small>
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  )
}
