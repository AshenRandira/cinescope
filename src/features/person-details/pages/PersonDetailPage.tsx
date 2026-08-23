import {
  ArrowLeft,
  ExternalLink,
} from 'lucide-react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router'

import {
  ErrorState,
  LoadingState,
} from '../../../components/feedback'
import {
  getTmdbImageSrcSet,
  getTmdbProfileUrl,
} from '../../../lib/tmdb/image'

import type {
  TmdbPersonDetails,
  TmdbPersonImage,
} from '../../../types/tmdb'

import { PersonCreditsSection } from '../components/PersonCreditsSection'
import { parsePersonId } from '../data/personDetail'
import { usePersonDetail } from '../hooks/usePersonDetail'

import '../../movie-details/pages/MovieDetailPage.css'
import './PersonDetailPage.css'

function formatDate(
  dateValue: string | null,
): string {
  if (!dateValue) {
    return 'Not recorded'
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

function getGenderLabel(gender: number): string {
  if (gender === 1) {
    return 'Female'
  }

  if (gender === 2) {
    return 'Male'
  }

  if (gender === 3) {
    return 'Non-binary'
  }

  return 'Not specified'
}

function getBiographyLead(biography: string): string {
  const normalizedBiography = biography
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalizedBiography) {
    return 'This contributor record does not yet include a biographical note.'
  }

  if (normalizedBiography.length <= 280) {
    return normalizedBiography
  }

  const excerpt = normalizedBiography.slice(0, 280)
  const lastSpace = excerpt.lastIndexOf(' ')

  return `${excerpt.slice(0, lastSpace > 200 ? lastSpace : 280)}…`
}

function getProfileImages(
  person: TmdbPersonDetails,
): TmdbPersonImage[] {
  const recordedPaths = new Set<string>()
  const images: TmdbPersonImage[] = []

  for (const image of person.images.profiles) {
    if (recordedPaths.has(image.file_path)) {
      continue
    }

    recordedPaths.add(image.file_path)
    images.push(image)

    if (images.length === 6) {
      break
    }
  }

  return images
}

function PersonDetailRouteState({
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

export function PersonDetailPage() {
  const { personId: routePersonId } = useParams<{
    personId: string
  }>()
  const personId = parsePersonId(routePersonId)
  const personQuery = usePersonDetail(personId)

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'auto',
    })
  }, [personId])

  useEffect(() => {
    document.title = personQuery.data
      ? `${personQuery.data.name} — CineScope`
      : 'Contributor Record — CineScope'
  }, [personQuery.data])

  if (personId === null) {
    return (
      <PersonDetailRouteState>
        <p className="archive-label">
          Record exception
        </p>
        <h1 className="movie-detail-state__title font-display">
          Invalid contributor record.
        </h1>
        <p className="movie-detail-state__message">
          This contributor link is not valid.
        </p>
        <Link
          className="movie-detail-state__link"
          to="/search?type=person"
        >
          Return to search
          <span aria-hidden="true"> →</span>
        </Link>
      </PersonDetailRouteState>
    )
  }

  if (personQuery.isPending) {
    return (
      <PersonDetailRouteState>
        <LoadingState
          title="Loading contributor details"
          message="Loading biography, photos, and credits."
        />
      </PersonDetailRouteState>
    )
  }

  if (personQuery.isMissing) {
    return (
      <PersonDetailRouteState>
        <p className="archive-label">Missing record</p>
        <h1 className="movie-detail-state__title font-display">
          This contributor could not be found.
        </h1>
        <p className="movie-detail-state__message">
          TMDB has no contributor with the ID {personId}.
        </p>
        <Link
          className="movie-detail-state__link"
          to="/search?type=person"
        >
          Return to search
          <span aria-hidden="true"> →</span>
        </Link>
      </PersonDetailRouteState>
    )
  }

  if (personQuery.isError) {
    return (
      <PersonDetailRouteState>
        <ErrorState
          title="Contributor details could not load"
          message={
            personQuery.errorMessage ??
            'The contributor record is temporarily unavailable.'
          }
          onRetry={personQuery.retry}
          retryLabel="Try again"
        />
      </PersonDetailRouteState>
    )
  }

  const person = personQuery.data

  if (!person) {
    return (
      <PersonDetailRouteState>
        <p className="archive-label">
          Record unavailable
        </p>
        <h1 className="movie-detail-state__title font-display">
          No contributor record was returned.
        </h1>
        <p className="movie-detail-state__message">
          Return to search and select another name.
        </p>
        <Link
          className="movie-detail-state__link"
          to="/search?type=person"
        >
          Return to search
          <span aria-hidden="true"> →</span>
        </Link>
      </PersonDetailRouteState>
    )
  }

  const profileUrl = getTmdbProfileUrl(
    person.profile_path,
    'h632',
  )
  const profileSrcSet = getTmdbImageSrcSet(
    person.profile_path,
    ['w342', 'w500', 'w780'],
  )
  const profileImages = getProfileImages(person)
  const backgroundImage = profileImages[1] ??
    profileImages[0]
  const backgroundUrl = getTmdbProfileUrl(
    backgroundImage?.file_path ?? person.profile_path,
    'original',
  )
  const imdbId =
    person.external_ids.imdb_id ?? person.imdb_id
  const externalLinks = [
    imdbId
      ? {
          href: `https://www.imdb.com/name/${encodeURIComponent(imdbId)}/`,
          label: 'IMDb',
        }
      : null,
    person.homepage
      ? {
          href: person.homepage,
          label: 'Official site',
        }
      : null,
    person.external_ids.instagram_id
      ? {
          href: `https://www.instagram.com/${encodeURIComponent(person.external_ids.instagram_id)}/`,
          label: 'Instagram',
        }
      : null,
    person.external_ids.twitter_id
      ? {
          href: `https://x.com/${encodeURIComponent(person.external_ids.twitter_id)}`,
          label: 'X / Twitter',
        }
      : null,
  ].filter(
    (
      link,
    ): link is {
      href: string
      label: string
    } => Boolean(link),
  )

  return (
    <div className="person-detail-page">
      <section
        className="person-detail-hero"
        aria-labelledby="person-detail-heading"
      >
        <div
          aria-hidden="true"
          className="person-detail-hero__background"
        >
          {backgroundUrl ? (
            <img alt="" src={backgroundUrl} />
          ) : null}
        </div>
        <div
          aria-hidden="true"
          className="person-detail-hero__shade"
        />

        <div className="person-detail-hero__inner">
          <Link
            className="person-detail-hero__return"
            to="/search?type=person"
          >
            <ArrowLeft aria-hidden="true" />
            Search the archive
          </Link>

          <div className="person-detail-hero__layout">
            <div className="person-detail-hero__copy">
              <p className="archive-label">
                Contributor
              </p>
              <h1
                className="person-detail-hero__title font-display"
                id="person-detail-heading"
              >
                {person.name}
              </h1>
              <p className="person-detail-hero__department">
                {person.known_for_department ||
                  'Screen contributor'}
              </p>
              <p className="person-detail-hero__lead text-pretty">
                {getBiographyLead(person.biography)}
              </p>

              <dl className="person-detail-hero__facts">
                <div>
                  <dt>Born</dt>
                  <dd>{formatDate(person.birthday)}</dd>
                </div>
                {person.deathday ? (
                  <div>
                    <dt>Died</dt>
                    <dd>{formatDate(person.deathday)}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Origin</dt>
                  <dd>
                    {person.place_of_birth ||
                      'Not recorded'}
                  </dd>
                </div>
              </dl>

              {externalLinks.length > 0 ? (
                <div className="person-detail-hero__links">
                  {externalLinks.map((link) => (
                    <a
                      href={link.href}
                      key={link.label}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {link.label}
                      <ExternalLink aria-hidden="true" />
                    </a>
                  ))}
                </div>
              ) : null}
            </div>

            <figure className="person-detail-hero__portrait">
              {profileUrl ? (
                <img
                  alt={`${person.name} portrait`}
                  decoding="async"
                  sizes="(max-width: 48rem) 72vw, 31vw"
                  src={profileUrl}
                  srcSet={profileSrcSet}
                />
              ) : (
                <div aria-hidden="true">
                  {person.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')}
                </div>
              )}
              <figcaption>
                <span>TMDB / Person {person.id}</span>
                <span>Archive portrait</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section
        className="person-biography"
        aria-labelledby="person-biography-heading"
      >
        <header className="person-section-heading">
          <div>
            <p className="archive-label">
              Biography
            </p>
            <h2
              className="font-display text-balance"
              id="person-biography-heading"
            >
              The life behind the work.
            </h2>
          </div>
          <p className="text-pretty">
            Biography and profile details from TMDB.
          </p>
        </header>

        <div className="person-biography__layout">
          <div className="person-biography__copy">
            {person.biography.trim() ? (
              person.biography
                .split(/\n{2,}/)
                .filter((paragraph) => paragraph.trim())
                .map((paragraph) => (
                  <p className="text-pretty" key={paragraph}>
                    {paragraph.trim()}
                  </p>
                ))
            ) : (
              <p className="person-biography__empty">
                No extended biography is attached to this
                contributor record.
              </p>
            )}
          </div>

          <aside className="person-biography__register">
            <p>Profile details</p>
            <dl>
              <div>
                <dt>Department</dt>
                <dd>
                  {person.known_for_department ||
                    'Not recorded'}
                </dd>
              </div>
              <div>
                <dt>Gender</dt>
                <dd>{getGenderLabel(person.gender)}</dd>
              </div>
              <div>
                <dt>Also known as</dt>
                <dd>
                  {person.also_known_as.length > 0
                    ? person.also_known_as
                        .slice(0, 6)
                        .join(' / ')
                    : 'No alternate names recorded'}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <PersonCreditsSection person={person} />

      {profileImages.length > 1 ? (
        <section
          className="person-portraits"
          aria-labelledby="person-portraits-heading"
        >
          <header className="person-section-heading">
            <div>
              <p className="archive-label">
                Portraits
              </p>
              <h2
                className="font-display text-balance"
                id="person-portraits-heading"
              >
                Faces held in the catalogue.
              </h2>
            </div>
            <p className="text-pretty">
              Additional profile photos from TMDB.
            </p>
          </header>

          <ul className="person-portraits__grid">
            {profileImages.map((image, index) => {
              const imageUrl = getTmdbProfileUrl(
                image.file_path,
                'h632',
              )
              const imageSrcSet = getTmdbImageSrcSet(
                image.file_path,
                ['w185', 'w342', 'w500'],
              )

              return imageUrl ? (
                <li key={image.file_path}>
                  <img
                    alt={`${person.name} archive portrait ${index + 1}`}
                    decoding="async"
                    loading="lazy"
                    sizes="(max-width: 40rem) 50vw, (max-width: 64rem) 33vw, 17vw"
                    src={imageUrl}
                    srcSet={imageSrcSet}
                  />
                </li>
              ) : null
            })}
          </ul>
        </section>
      ) : null}

      <footer className="person-detail-return">
        <p>End of contributor record / {person.id}</p>
        <Link to="/search?type=person">
          Search another name
          <span aria-hidden="true"> →</span>
        </Link>
      </footer>
    </div>
  )
}
