import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'

import {
  getTmdbImageSrcSet,
  getTmdbPosterUrl,
  getTmdbProfileUrl,
} from '../../../lib/tmdb/image'

import { LibraryControls } from '../../library/components/LibraryControls'

import type {
  SearchRecord,
} from '../data/search'

import './SearchResultCard.css'

type SearchResultCardProps = {
  record: SearchRecord
}

const MEDIA_TYPE_LABELS = {
  movie: 'Movie',
  person: 'Person',
  tv: 'TV series',
} as const

function formatVoteCount(
  voteCount: number,
): string {
  if (voteCount === 1) {
    return '1 vote'
  }

  return `${voteCount.toLocaleString()} votes`
}

export function SearchResultCard({
  record,
}: SearchResultCardProps) {
  const imageUrl =
    record.imageType === 'profile'
      ? getTmdbProfileUrl(
          record.imagePath,
          'w342',
        )
      : getTmdbPosterUrl(
          record.imagePath,
          'w500',
        )

  const imageSrcSet = getTmdbImageSrcSet(
    record.imagePath,
    record.imageType === 'profile'
      ? ['w185', 'w342']
      : ['w185', 'w342', 'w500'],
  )

  const mediaTypeLabel =
    MEDIA_TYPE_LABELS[record.mediaType]

  const metadata = [
    record.dateYear,
    record.originalLanguage?.toUpperCase(),
  ].filter(
    (value): value is string =>
      Boolean(value),
  )

  return (
    <li>
      <article
        className={[
          'search-record',
          `search-record--${record.mediaType}`,
        ].join(' ')}
        aria-labelledby={`search-record-${record.mediaType}-${record.id}`}
      >
        <div className="search-record__artwork">
          {imageUrl ? (
            <img
              alt={
                record.imageType === 'profile'
                  ? `${record.title} profile`
                  : `${record.title} poster`
              }
              decoding="async"
              loading="lazy"
              sizes="(max-width: 40rem) 38vw, (max-width: 64rem) 28vw, 18vw"
              src={imageUrl}
              srcSet={imageSrcSet}
            />
          ) : (
            <div
              className="search-record__artwork-fallback"
              aria-hidden="true"
            >
              <span>
                {record.title
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </div>
          )}

          <div className="search-record__copy">
          <div className="search-record__classification">
            <span>{mediaTypeLabel}</span>

            {record.knownForDepartment ? (
              <span>
                {record.knownForDepartment}
              </span>
            ) : null}
          </div>

          <h3
            className="search-record__title font-display"
            id={`search-record-${record.mediaType}-${record.id}`}
          >
            {record.title}
          </h3>

          {metadata.length > 0 ? (
            <p className="search-record__metadata">
              {metadata.map((value, valueIndex) => (
                <span key={value}>
                  {valueIndex > 0 ? (
                    <span aria-hidden="true">
                      {' / '}
                    </span>
                  ) : null}

                  {value}
                </span>
              ))}
            </p>
          ) : null}

          {record.overview ? (
            <p className="search-record__overview text-pretty">
              {record.overview}
            </p>
          ) : record.mediaType !== 'person' ? (
            <p className="search-record__overview search-record__overview--missing">
              Synopsis unavailable for this record.
            </p>
          ) : null}

          {record.mediaType !== 'person' ? (
            <p className="search-record__rating">
              {record.score === null
                ? 'Not yet rated'
                : `${record.score.toFixed(1)} / 10`}

              <span aria-hidden="true">/</span>

              {formatVoteCount(record.voteCount)}
            </p>
          ) : null}

          {record.matchReasons.length > 0 ? (
            <div className="search-record__match">
              <span>Why it matches</span>
              <ul>
                {record.matchReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <footer className="search-record__footer">
            {record.mediaType === 'movie' ? (
              <Link
                aria-label={`View movie details for ${record.title}`}
                to={`/movies/${record.id}`}
              >
                View movie details
                <ArrowRight aria-hidden="true" />
              </Link>
            ) : record.mediaType === 'tv' ? (
              <Link
                aria-label={`View series details for ${record.title}`}
                to={`/tv/${record.id}`}
              >
                View series details
                <ArrowRight aria-hidden="true" />
              </Link>
            ) : (
              <Link
                aria-label={`View contributor profile for ${record.title}`}
                to={`/people/${record.id}`}
              >
                View contributor profile
                <ArrowRight aria-hidden="true" />
              </Link>
            )}

            {record.mediaType !== 'person' ? (
              <LibraryControls
                candidate={{
                  backdropPath: null,
                  id: record.id,
                  mediaType: record.mediaType,
                  overview: record.overview,
                  posterPath: record.imagePath,
                  releaseYear: record.dateYear,
                  title: record.title,
                }}
                variant="save"
              />
            ) : null}
          </footer>
          </div>
        </div>

        <div className="search-record__caption">
          <span>{mediaTypeLabel}</span>
          <Link
            to={
              record.mediaType === 'movie'
                ? `/movies/${record.id}`
                : record.mediaType === 'tv'
                  ? `/tv/${record.id}`
                  : `/people/${record.id}`
            }
          >
            <strong className="font-display">{record.title}</strong>
          </Link>
          {metadata.length > 0 ? <small>{metadata.join(' / ')}</small> : null}
        </div>
      </article>
    </li>
  )
}
