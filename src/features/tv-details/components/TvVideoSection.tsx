import {
  ExternalLink,
  Play,
} from 'lucide-react'

import {
  getTmdbBackdropUrl,
  getTmdbImageSrcSet,
  getTmdbPosterUrl,
} from '../../../lib/tmdb/image'

import type {
  TmdbTvDetails,
  TmdbVideo,
} from '../../../types/tmdb'

import './TvVideoSection.css'

const VIDEO_TYPE_PRIORITY: Readonly<
  Record<string, number>
> = {
  Trailer: 50,
  Teaser: 40,
  Clip: 30,
  Featurette: 20,
  'Behind the Scenes': 10,
}

function getVideoPriority(
  video: TmdbVideo,
): number {
  return (
    (video.official ? 100 : 0) +
    (VIDEO_TYPE_PRIORITY[video.type] ?? 0) +
    (video.iso_639_1 === 'en' ? 5 : 0)
  )
}

function getVideoRecords(
  videos: TmdbVideo[],
): TmdbVideo[] {
  return videos
    .filter(
      (video) =>
        video.site === 'YouTube' &&
        video.key.trim().length > 0,
    )
    .sort(
      (first, second) =>
        getVideoPriority(second) -
          getVideoPriority(first) ||
        second.published_at.localeCompare(
          first.published_at,
        ),
    )
    .slice(0, 4)
}

function getYoutubeUrl(videoKey: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoKey)}`
}

function formatVideoDate(
  publishedAt: string,
): string {
  const date = new Date(publishedAt)

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable'
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function TvVideoSection({
  show,
}: {
  show: TmdbTvDetails
}) {
  const videoRecords = getVideoRecords(
    show.videos.results,
  )
  const primaryVideo = videoRecords[0] ?? null
  const additionalVideos = videoRecords.slice(1)
  const backdropUrl = getTmdbBackdropUrl(
    show.backdrop_path,
    'w1280',
  )
  const posterUrl = getTmdbPosterUrl(
    show.poster_path,
    'w780',
  )
  const artworkUrl = backdropUrl ?? posterUrl
  const artworkSrcSet = backdropUrl
    ? getTmdbImageSrcSet(
        show.backdrop_path,
        ['w780', 'w1280'],
      )
    : getTmdbImageSrcSet(
        show.poster_path,
        ['w500', 'w780'],
      )

  return (
    <section
      className="tv-video-section"
      aria-labelledby="tv-video-heading"
    >
      <header className="tv-video-section__heading">
        <div>
          <p className="archive-label">
            02 / Videos
          </p>

          <h2
            className="tv-video-section__title font-display text-balance"
            id="tv-video-heading"
          >
            Watch trailers and clips.
          </h2>
        </div>

        <p className="text-pretty">
          Official trailers, teasers, and production videos listed by TMDB.
        </p>
      </header>

      {primaryVideo ? (
        <div className="tv-video-feature">
          <a
            aria-label={`Watch ${primaryVideo.name} on YouTube`}
            className="tv-video-feature__stage"
            href={getYoutubeUrl(primaryVideo.key)}
            rel="noreferrer"
            target="_blank"
          >
            {artworkUrl ? (
              <img
                alt=""
                decoding="async"
                loading="lazy"
                sizes="(max-width: 48rem) 100vw, 66vw"
                src={artworkUrl}
                srcSet={artworkSrcSet}
              />
            ) : (
              <span className="tv-video-feature__fallback">
                Series artwork unavailable
              </span>
            )}

            <span className="tv-video-feature__shade" />

            <span className="tv-video-feature__play">
              <Play aria-hidden="true" />
            </span>

            <span className="tv-video-feature__caption">
              Open official video
              <ExternalLink aria-hidden="true" />
            </span>
          </a>

          <aside className="tv-video-feature__record">
            <p>Primary video record</p>
            <h3 className="font-display">
              {primaryVideo.name}
            </h3>
            <dl>
              <div>
                <dt>Type</dt>
                <dd>{primaryVideo.type}</dd>
              </div>
              <div>
                <dt>Published</dt>
                <dd>
                  {formatVideoDate(
                    primaryVideo.published_at,
                  )}
                </dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{primaryVideo.site}</dd>
              </div>
            </dl>
          </aside>
        </div>
      ) : (
        <div className="tv-video-empty">
          <p>No moving-image records</p>
          <h3 className="font-display">
            This series has no supported videos indexed.
          </h3>
        </div>
      )}

      {additionalVideos.length > 0 ? (
        <div className="tv-video-additional">
          <p>More videos</p>
          <ul>
            {additionalVideos.map((video, index) => (
              <li key={video.id}>
                <a
                  href={getYoutubeUrl(video.key)}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span>
                    {String(index + 2).padStart(2, '0')}
                  </span>
                  <strong>{video.name}</strong>
                  <small>
                    {video.type} /{' '}
                    {formatVideoDate(
                      video.published_at,
                    )}
                  </small>
                  <ExternalLink aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
