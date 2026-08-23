import {
    getTmdbImageSrcSet,
    getTmdbProfileUrl,
  } from '../../../lib/tmdb/image'

  import { Link } from 'react-router'

  import type {
    TmdbMovieCrewMember,
    TmdbMovieDetails,
  } from '../../../types/tmdb'

  import './MovieDetailSections.css'

  type MovieDetailSectionsProps = {
    movie: TmdbMovieDetails
  }

  type CrewGroupDefinition = {
    jobs: readonly string[]
    label: string
  }

  const KEY_CREW_GROUPS: readonly CrewGroupDefinition[] = [
    {
      label: 'Direction',
      jobs: ['Director'],
    },
    {
      label: 'Writing',
      jobs: [
        'Screenplay',
        'Writer',
        'Story',
        'Novel',
        'Characters',
      ],
    },
    {
      label: 'Cinematography',
      jobs: [
        'Director of Photography',
        'Cinematography',
      ],
    },
    {
      label: 'Editing',
      jobs: ['Editor'],
    },
    {
      label: 'Original music',
      jobs: ['Original Music Composer'],
    },
  ]

  function formatReleaseDate(
    releaseDate: string,
  ): string {
    if (!releaseDate) {
      return 'Release date unavailable'
    }

    const date = new Date(`${releaseDate}T00:00:00`)

    if (Number.isNaN(date.getTime())) {
      return releaseDate
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
    if (
      runtime === null ||
      !Number.isFinite(runtime) ||
      runtime <= 0
    ) {
      return 'Runtime unavailable'
    }

    const hours = Math.floor(runtime / 60)
    const minutes = runtime % 60

    if (hours === 0) {
      return `${minutes} min`
    }

    if (minutes === 0) {
      return `${hours} hr`
    }

    return `${hours} hr ${minutes} min`
  }

  function joinLabels(
    labels: string[],
    fallback: string,
  ): string {
    const uniqueLabels = [...new Set(
      labels
        .map((label) => label.trim())
        .filter(Boolean),
    )]

    return uniqueLabels.length > 0
      ? uniqueLabels.join(', ')
      : fallback
  }

  function getOriginalLanguageLabel(
    movie: TmdbMovieDetails,
  ): string {
    const matchingLanguage =
      movie.spoken_languages.find(
        (language) =>
          language.iso_639_1 ===
          movie.original_language,
      )

    return (
      matchingLanguage?.english_name ||
      matchingLanguage?.name ||
      movie.original_language.toUpperCase() ||
      'Language unavailable'
    )
  }

  function getCrewNames(
    crew: TmdbMovieCrewMember[],
    jobs: readonly string[],
  ): string[] {
    const matchingJobs = new Set(jobs)
    const recordedPeople = new Set<number>()
    const names: string[] = []

    for (const member of crew) {
      if (
        !matchingJobs.has(member.job) ||
        recordedPeople.has(member.id)
      ) {
        continue
      }

      recordedPeople.add(member.id)
      names.push(member.name)

      if (names.length === 3) {
        break
      }
    }

    return names
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

  export function MovieDetailSections({
    movie,
  }: MovieDetailSectionsProps) {
    const spokenLanguages = joinLabels(
      movie.spoken_languages.map(
        (language) =>
          language.english_name ||
          language.name ||
          language.iso_639_1.toUpperCase(),
      ),
      'Language information unavailable',
    )

    const productionCountries = joinLabels(
      movie.production_countries.map(
        (country) =>
          country.name ||
          country.iso_3166_1,
      ),
      movie.origin_country.length > 0
        ? movie.origin_country.join(', ')
        : 'Country information unavailable',
    )

    const productionCompanies = joinLabels(
      movie.production_companies.map(
        (company) => company.name,
      ),
      'Production company information unavailable',
    )

    const cast = [...movie.credits.cast]
      .sort(
        (firstMember, secondMember) =>
          firstMember.order - secondMember.order,
      )
      .slice(0, 12)

    const crewGroups = KEY_CREW_GROUPS
      .map((group) => ({
        label: group.label,
        names: getCrewNames(
          movie.credits.crew,
          group.jobs,
        ),
      }))
      .filter((group) => group.names.length > 0)

    const originalTitleNote =
      movie.original_title &&
      movie.original_title !== movie.title
        ? movie.original_title
        : 'Matches the primary display title'

    const collectionLabel =
      movie.belongs_to_collection?.name ??
      'Not attached to a recorded collection'

    return (
      <div className="movie-detail-sections">
        <section
          className="movie-detail-record"
          aria-labelledby="movie-record-heading"
        >
          <header className="movie-detail-section-heading">
            <div>
              <p className="archive-label">
                Movie details
              </p>

              <h2
                className="movie-detail-section-heading__title font-display text-balance"
                id="movie-record-heading"
              >
                The catalogue facts behind the frame.
              </h2>
            </div>

            <p className="movie-detail-section-heading__copy text-pretty">
              Release, language, country, and production details from TMDB.
            </p>
          </header>

          <div className="movie-detail-record__layout">
            <dl className="movie-detail-fact-grid">
              <div>
                <dt>Primary release</dt>
                <dd>
                  {formatReleaseDate(
                    movie.release_date,
                  )}
                </dd>
              </div>

              <div>
                <dt>Runtime</dt>
                <dd>{formatRuntime(movie.runtime)}</dd>
              </div>

              <div>
                <dt>Production status</dt>
                <dd>
                  {movie.status ||
                    'Status unavailable'}
                </dd>
              </div>

              <div>
                <dt>Original language</dt>
                <dd>
                  {getOriginalLanguageLabel(movie)}
                </dd>
              </div>

              <div>
                <dt>Spoken languages</dt>
                <dd>{spokenLanguages}</dd>
              </div>

              <div>
                <dt>Production countries</dt>
                <dd>{productionCountries}</dd>
              </div>
            </dl>

            <aside
              className="movie-detail-archive-notes"
              aria-label="Additional catalogue notes"
            >
              <div>
                <h3>Genres</h3>

                {movie.genres.length > 0 ? (
                  <ul className="movie-detail-genre-list">
                    {movie.genres.map((genre) => (
                      <li key={genre.id}>
                        {genre.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Genre information unavailable.</p>
                )}
              </div>

              <div>
                <h3>Original title</h3>
                <p>{originalTitleNote}</p>
              </div>

              <div>
                <h3>Collection record</h3>
                <p>{collectionLabel}</p>
              </div>

              <div>
                <h3>Production companies</h3>
                <p>{productionCompanies}</p>
              </div>
            </aside>
          </div>
        </section>

        <section
          className="movie-detail-credits"
          aria-labelledby="movie-credits-heading"
        >
          <header className="movie-detail-section-heading">
            <div>
              <p className="archive-label">
                Cast and crew
              </p>

              <h2
                className="movie-detail-section-heading__title font-display text-balance"
                id="movie-credits-heading"
              >
                The people recorded around the production.
              </h2>
            </div>

            <p className="movie-detail-section-heading__copy text-pretty">
              Main cast in credited order, followed by key crew roles.
            </p>
          </header>

          <div className="movie-detail-credits__layout">
            <aside
              className="movie-detail-key-crew"
              aria-labelledby="movie-key-crew-heading"
            >
              <p className="movie-detail-subsection-index">
                Selected departments
              </p>

              <h3
                className="movie-detail-subsection-title font-display"
                id="movie-key-crew-heading"
              >
                Key crew
              </h3>

              {crewGroups.length > 0 ? (
                <dl className="movie-detail-key-crew__list">
                  {crewGroups.map((group) => (
                    <div key={group.label}>
                      <dt>{group.label}</dt>
                      <dd>{group.names.join(', ')}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="movie-detail-section-empty">
                  Key crew information is not available for
                  this record.
                </p>
              )}
            </aside>

            <div
              className="movie-detail-cast"
              aria-labelledby="movie-cast-heading"
            >
              <div className="movie-detail-cast__heading">
                <div>
                  <p className="movie-detail-subsection-index">
                    Credited order
                  </p>

                  <h3
                    className="movie-detail-subsection-title font-display"
                    id="movie-cast-heading"
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
                  {cast.map((member) => {
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
                        <Link
                          aria-label={`View contributor profile for ${member.name}`}
                          className="movie-detail-cast-card__link"
                          to={`/people/${member.id}`}
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

                          </div>

                          <div className="movie-detail-cast-card__caption">
                            <h4>{member.name}</h4>

                            <p>
                              {member.character ||
                                'Role unavailable'}
                            </p>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="movie-detail-section-empty">
                  Cast information is not available for this
                  record.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    )
  }
