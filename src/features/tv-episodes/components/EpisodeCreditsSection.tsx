import {
  getTmdbImageSrcSet,
  getTmdbProfileUrl,
} from '../../../lib/tmdb/image'

import type {
  TmdbTvCastMember,
  TmdbTvCrewMember,
  TmdbTvEpisodeDetails,
  TmdbTvEpisodeGuestStar,
} from '../../../types/tmdb'

import './TvEpisodeSections.css'

type EpisodePerformer =
  | TmdbTvCastMember
  | TmdbTvEpisodeGuestStar

function getInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return initials || 'CS'
}

function getPerformers(
  episode: TmdbTvEpisodeDetails,
): EpisodePerformer[] {
  const recordedIds = new Set<number>()
  const performers: EpisodePerformer[] = []

  for (const performer of [
    ...episode.credits.cast,
    ...episode.credits.guest_stars,
  ]) {
    if (recordedIds.has(performer.id)) {
      continue
    }

    recordedIds.add(performer.id)
    performers.push(performer)

    if (performers.length === 12) {
      break
    }
  }

  return performers
}

function getCrewByJobs(
  crew: TmdbTvCrewMember[],
  jobs: ReadonlyArray<string>,
): string {
  const names = crew
    .filter((member) => jobs.includes(member.job))
    .map((member) => member.name)

  return [...new Set(names)].join(', ')
}

export function EpisodeCreditsSection({
  episode,
}: {
  episode: TmdbTvEpisodeDetails
}) {
  const performers = getPerformers(episode)
  const crew = [
    ...episode.crew,
    ...episode.credits.crew,
  ]
  const directors = getCrewByJobs(crew, ['Director'])
  const writers = getCrewByJobs(crew, [
    'Writer',
    'Screenplay',
    'Teleplay',
    'Story',
  ])
  const cinematography = getCrewByJobs(crew, [
    'Director of Photography',
    'Cinematography',
  ])
  const editors = getCrewByJobs(crew, ['Editor'])

  return (
    <section
      className="tv-episode-credits"
      aria-labelledby="episode-credits-heading"
    >
      <header className="tv-episode-section-heading">
        <div>
          <p className="archive-label">
            04 / Episode personnel
          </p>
          <h2
            className="font-display text-balance"
            id="episode-credits-heading"
          >
            The names held inside this frame.
          </h2>
        </div>
        <p className="text-pretty">
          Principal and guest performers, followed by
          selected production roles from the episode
          credits.
        </p>
      </header>

      <div className="tv-episode-credits__layout">
        <aside className="tv-episode-crew">
          <p>Production register</p>
          <h3 className="font-display">
            Behind the transmission
          </h3>
          <dl>
            <div>
              <dt>Directed by</dt>
              <dd>{directors || 'Not indexed'}</dd>
            </div>
            <div>
              <dt>Written by</dt>
              <dd>{writers || 'Not indexed'}</dd>
            </div>
            <div>
              <dt>Photography</dt>
              <dd>{cinematography || 'Not indexed'}</dd>
            </div>
            <div>
              <dt>Edited by</dt>
              <dd>{editors || 'Not indexed'}</dd>
            </div>
          </dl>
        </aside>

        <div className="tv-episode-performers">
          <div className="tv-episode-performers__heading">
            <h3 className="font-display">
              Cast and guest register
            </h3>
            <span>{performers.length} shown</span>
          </div>

          {performers.length > 0 ? (
            <ul className="tv-episode-performers__grid">
              {performers.map((performer, index) => {
                const profileUrl = getTmdbProfileUrl(
                  performer.profile_path,
                  'w342',
                )
                const profileSrcSet =
                  getTmdbImageSrcSet(
                    performer.profile_path,
                    ['w185', 'w342'],
                  )

                return (
                  <li key={performer.credit_id}>
                    <div className="tv-episode-performer__portrait">
                      {profileUrl ? (
                        <img
                          alt={`${performer.name} portrait`}
                          decoding="async"
                          loading="lazy"
                          sizes="(max-width: 40rem) 45vw, (max-width: 64rem) 25vw, 12vw"
                          src={profileUrl}
                          srcSet={profileSrcSet}
                        />
                      ) : (
                        <span aria-hidden="true">
                          {getInitials(performer.name)}
                        </span>
                      )}
                      <small>
                        {String(index + 1).padStart(2, '0')}
                      </small>
                    </div>
                    <h4>{performer.name}</h4>
                    <p>
                      {performer.character ||
                        'Role unavailable'}
                    </p>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="tv-episode-performers__empty">
              No performer credits are attached to this
              episode record.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
