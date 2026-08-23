import {
  ExternalLink,
  Play,
} from 'lucide-react'

import {
  getTmdbImageSrcSet,
  getTmdbImageUrl,
} from '../../../lib/tmdb/image'

import type {
  TmdbTvEpisodeDetails,
  TmdbTvEpisodeImage,
  TmdbVideo,
} from '../../../types/tmdb'

import './TvEpisodeSections.css'

const VIDEO_TYPE_PRIORITY: Readonly<
  Record<string, number>
> = {
  Trailer: 50,
  Teaser: 40,
  Clip: 30,
  Featurette: 20,
  'Behind the Scenes': 10,
}

function getVideoRecords(
  episode: TmdbTvEpisodeDetails,
): TmdbVideo[] {
  return episode.videos.results
    .filter(
      (video) =>
        video.site === 'YouTube' &&
        video.key.trim().length > 0,
    )
    .sort(
      (first, second) =>
        (second.official ? 100 : 0) -
          (first.official ? 100 : 0) ||
        (VIDEO_TYPE_PRIORITY[second.type] ?? 0) -
          (VIDEO_TYPE_PRIORITY[first.type] ?? 0),
    )
    .slice(0, 4)
}

function getStillRecords(
  episode: TmdbTvEpisodeDetails,
): TmdbTvEpisodeImage[] {
  const recordedPaths = new Set<string>()
  const stills: TmdbTvEpisodeImage[] = []

  for (const still of episode.images.stills) {
    if (
      !still.file_path ||
      recordedPaths.has(still.file_path)
    ) {
      continue
    }

    recordedPaths.add(still.file_path)
    stills.push(still)

    if (stills.length === 6) {
      break
    }
  }

  return stills
}

function getYoutubeUrl(key: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(key)}`
}

export function EpisodeMediaSection({
  episode,
}: {
  episode: TmdbTvEpisodeDetails
}) {
  const videos = getVideoRecords(episode)
  const primaryVideo = videos[0] ?? null
  const additionalVideos = videos.slice(1)
  const stills = getStillRecords(episode)
  const primaryStillUrl = getTmdbImageUrl(
    episode.still_path,
    'w1280',
  )
  const primaryStillSrcSet = getTmdbImageSrcSet(
    episode.still_path,
    ['w500', 'w780', 'w1280'],
  )

  return (
    <section
      className="tv-episode-media"
      aria-labelledby="episode-media-heading"
    >
      <header className="tv-episode-section-heading">
        <div>
          <p className="archive-label">
            Images and videos
          </p>
          <h2
            className="font-display text-balance"
            id="episode-media-heading"
          >
            Hold the episode against the light.
          </h2>
        </div>
        <p className="text-pretty">
          Episode images and videos from TMDB. Video links open on YouTube.
        </p>
      </header>

      {primaryVideo ? (
        <div className="tv-episode-video">
          <a
            aria-label={`Watch ${primaryVideo.name} on YouTube`}
            className="tv-episode-video__stage"
            href={getYoutubeUrl(primaryVideo.key)}
            rel="noreferrer"
            target="_blank"
          >
            {primaryStillUrl ? (
              <img
                alt=""
                decoding="async"
                loading="lazy"
                sizes="(max-width: 56rem) 100vw, 68vw"
                src={primaryStillUrl}
                srcSet={primaryStillSrcSet}
              />
            ) : (
              <span className="tv-episode-video__fallback">
                Episode still unavailable
              </span>
            )}
            <span className="tv-episode-video__shade" />
            <span className="tv-episode-video__play">
              <Play aria-hidden="true" />
            </span>
          </a>

          <aside className="tv-episode-video__record">
            <p>Primary video record</p>
            <h3 className="font-display">
              {primaryVideo.name}
            </h3>
            <span>
              {primaryVideo.type} / {primaryVideo.site}
            </span>
            <a
              href={getYoutubeUrl(primaryVideo.key)}
              rel="noreferrer"
              target="_blank"
            >
              Open video
              <ExternalLink aria-hidden="true" />
            </a>
          </aside>
        </div>
      ) : (
        <div className="tv-episode-video-empty">
          <p>No video available</p>
          <h3 className="font-display">
            TMDB has no supported video attached to this
            episode.
          </h3>
        </div>
      )}

      {additionalVideos.length > 0 ? (
        <ul className="tv-episode-video-list">
          {additionalVideos.map((video) => (
            <li key={video.id}>
              <a
                href={getYoutubeUrl(video.key)}
                rel="noreferrer"
                target="_blank"
              >
                <strong>{video.name}</strong>
                <small>{video.type}</small>
                <ExternalLink aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {stills.length > 0 ? (
        <div className="tv-episode-stills">
          <div className="tv-episode-stills__heading">
            <p>Episode images</p>
            <span>
              {stills.length} preserved{' '}
              {stills.length === 1 ? 'frame' : 'frames'}
            </span>
          </div>
          <ul className="tv-episode-stills__grid">
            {stills.map((still, index) => {
              const imageUrl = getTmdbImageUrl(
                still.file_path,
                'w780',
              )
              const imageSrcSet = getTmdbImageSrcSet(
                still.file_path,
                ['w300', 'w500', 'w780'],
              )

              return (
                <li key={still.file_path}>
                  {imageUrl ? (
                    <img
                      alt={`Episode still ${index + 1}`}
                      decoding="async"
                      loading="lazy"
                      sizes="(max-width: 40rem) 100vw, (max-width: 64rem) 50vw, 33vw"
                      src={imageUrl}
                      srcSet={imageSrcSet}
                    />
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
