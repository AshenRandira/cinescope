import {
    useEffect,
    useRef,
    useState,
    type MouseEvent,
  } from 'react'
  
  import {
    ExternalLink,
    Play,
    X,
  } from 'lucide-react'
  
  import {
    getTmdbBackdropUrl,
    getTmdbImageSrcSet,
    getTmdbPosterUrl,
  } from '../../../lib/tmdb/image'
  
  import type {
    TmdbMovieDetails,
    TmdbVideo,
  } from '../../../types/tmdb'
  
  import './MovieVideoSection.css'
  
  type MovieVideoSectionProps = {
    movie: TmdbMovieDetails
  }
  
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
    const typePriority =
      VIDEO_TYPE_PRIORITY[video.type] ?? 0
  
    const officialPriority = video.official
      ? 100
      : 0
  
    const languagePriority =
      video.iso_639_1 === 'en' ? 5 : 0
  
    return (
      officialPriority +
      typePriority +
      languagePriority
    )
  }
  
  function getPublishedTimestamp(
    publishedAt: string,
  ): number {
    const timestamp = Date.parse(publishedAt)
  
    return Number.isNaN(timestamp)
      ? 0
      : timestamp
  }
  
  function getSupportedVideos(
    videos: TmdbVideo[],
  ): TmdbVideo[] {
    return videos
      .filter(
        (video) =>
          video.site === 'YouTube' &&
          video.key.trim().length > 0,
      )
      .sort((firstVideo, secondVideo) => {
        const priorityDifference =
          getVideoPriority(secondVideo) -
          getVideoPriority(firstVideo)
  
        if (priorityDifference !== 0) {
          return priorityDifference
        }
  
        return (
          getPublishedTimestamp(
            secondVideo.published_at,
          ) -
          getPublishedTimestamp(
            firstVideo.published_at,
          )
        )
      })
  }
  
  function formatVideoDate(
    publishedAt: string,
  ): string {
    const date = new Date(publishedAt)
  
    if (Number.isNaN(date.getTime())) {
      return 'Publication date unavailable'
    }
  
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      year: 'numeric',
    }).format(date)
  }
  
  function getVideoEmbedUrl(
    videoKey: string,
  ): string {
    return (
      'https://www.youtube-nocookie.com/embed/' +
      `${encodeURIComponent(videoKey)}` +
      '?autoplay=1&playsinline=1&rel=0'
    )
  }
  
  function getVideoExternalUrl(
    videoKey: string,
  ): string {
    return (
      'https://www.youtube.com/watch?v=' +
      encodeURIComponent(videoKey)
    )
  }
  
  export function MovieVideoSection({
    movie,
  }: MovieVideoSectionProps) {
    const dialogRef =
      useRef<HTMLDialogElement>(null)
  
    const [activeVideo, setActiveVideo] =
      useState<TmdbVideo | null>(null)
  
    const supportedVideos = getSupportedVideos(
      movie.videos.results,
    )
  
    const primaryVideo =
      supportedVideos[0] ?? null
  
    const additionalVideos =
      supportedVideos.slice(1, 4)
  
    const backdropUrl = getTmdbBackdropUrl(
      movie.backdrop_path,
      'w1280',
    )
  
    const posterUrl = getTmdbPosterUrl(
      movie.poster_path,
      'w780',
    )
  
    const artworkUrl = backdropUrl ?? posterUrl
    const artworkUsesBackdrop =
      backdropUrl !== null
  
    const artworkSrcSet = artworkUsesBackdrop
      ? getTmdbImageSrcSet(
          movie.backdrop_path,
          ['w780', 'w1280'],
        )
      : getTmdbImageSrcSet(
          movie.poster_path,
          ['w500', 'w780'],
        )
  
    useEffect(() => {
      const dialog = dialogRef.current
  
      if (!dialog) {
        return
      }
  
      if (activeVideo && !dialog.open) {
        dialog.showModal()
        return
      }
  
      if (!activeVideo && dialog.open) {
        dialog.close()
      }
    }, [activeVideo])
  
    useEffect(() => {
      if (!activeVideo) {
        return
      }
  
      const previousOverflow =
        document.body.style.overflow
  
      document.body.style.overflow = 'hidden'
  
      return () => {
        document.body.style.overflow =
          previousOverflow
      }
    }, [activeVideo])
  
    function openVideo(video: TmdbVideo): void {
      setActiveVideo(video)
    }
  
    function closeVideo(): void {
      dialogRef.current?.close()
    }
  
    function handleDialogClick(
      event: MouseEvent<HTMLDialogElement>,
    ): void {
      if (event.target === event.currentTarget) {
        event.currentTarget.close()
      }
    }
  
    return (
      <section
        className="movie-video-section"
        aria-labelledby="movie-video-heading"
      >
        <header className="movie-video-section__heading">
          <div>
            <p className="archive-label">
              02 / Projection material
            </p>
  
            <h2
              className="movie-video-section__title font-display text-balance"
              id="movie-video-heading"
            >
              Motion preserved alongside the record.
            </h2>
          </div>
  
          <p className="movie-video-section__copy text-pretty">
            Official trailers and selected production
            footage associated with this feature’s TMDB
            catalogue entry.
          </p>
        </header>
  
        {primaryVideo ? (
          <div className="movie-video-feature">
            <button
              className="movie-video-feature__stage"
              type="button"
              onClick={() =>
                openVideo(primaryVideo)
              }
              aria-label={`Play ${primaryVideo.name}`}
            >
              {artworkUrl ? (
                <img
                  alt=""
                  decoding="async"
                  loading="lazy"
                  sizes="(max-width: 48rem) 100vw, 68vw"
                  src={artworkUrl}
                  srcSet={artworkSrcSet}
                />
              ) : (
                <span className="movie-video-feature__fallback">
                  Projection artwork unavailable
                </span>
              )}
  
              <span className="movie-video-feature__shade" />
  
              <span className="movie-video-feature__play">
                <Play aria-hidden="true" />
              </span>
  
              <span className="movie-video-feature__caption">
                <span>
                  Selected {primaryVideo.type}
                </span>
  
                <strong>{primaryVideo.name}</strong>
              </span>
            </button>
  
            <aside className="movie-video-feature__record">
              <p className="movie-video-feature__index">
                Primary projection
              </p>
  
              <h3 className="font-display">
                {primaryVideo.name}
              </h3>
  
              <dl>
                <div>
                  <dt>Material type</dt>
                  <dd>
                    {primaryVideo.type ||
                      'Video'}
                  </dd>
                </div>
  
                <div>
                  <dt>Publication</dt>
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
  
                <div>
                  <dt>Record status</dt>
                  <dd>
                    {primaryVideo.official
                      ? 'Official'
                      : 'Supplementary'}
                  </dd>
                </div>
              </dl>
  
              <button
                className="movie-video-feature__action"
                type="button"
                onClick={() =>
                  openVideo(primaryVideo)
                }
              >
                <Play aria-hidden="true" />
                Begin projection
              </button>
            </aside>
          </div>
        ) : (
          <div className="movie-video-empty">
            <p className="movie-video-empty__index">
              Projection unavailable
            </p>
  
            <h3 className="font-display">
              No supported footage is attached.
            </h3>
  
            <p>
              This movie record does not currently contain
              a playable YouTube trailer or production
              video.
            </p>
          </div>
        )}
  
        {additionalVideos.length > 0 ? (
          <div className="movie-video-additional">
            <div className="movie-video-additional__heading">
              <p>Additional footage</p>
  
              <span>
                {additionalVideos.length} selected
                {additionalVideos.length === 1
                  ? ' record'
                  : ' records'}
              </span>
            </div>
  
            <ul>
              {additionalVideos.map(
                (video, index) => (
                  <li key={video.id}>
                    <button
                      type="button"
                      onClick={() =>
                        openVideo(video)
                      }
                    >
                      <span className="movie-video-additional__number">
                        {String(index + 2).padStart(
                          2,
                          '0',
                        )}
                      </span>
  
                      <span className="movie-video-additional__name">
                        <strong>{video.name}</strong>
  
                        <small>
                          {video.type || 'Video'} /{' '}
                          {formatVideoDate(
                            video.published_at,
                          )}
                        </small>
                      </span>
  
                      <Play
                        className="movie-video-additional__play"
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                ),
              )}
            </ul>
          </div>
        ) : null}
  
        <dialog
          className="movie-video-dialog"
          ref={dialogRef}
          aria-labelledby="movie-video-dialog-title"
          onCancel={() =>
            setActiveVideo(null)
          }
          onClick={handleDialogClick}
          onClose={() =>
            setActiveVideo(null)
          }
        >
          {activeVideo ? (
            <div className="movie-video-dialog__panel">
              <header className="movie-video-dialog__header">
                <div>
                  <p>
                    {activeVideo.type ||
                      'Video projection'}
                  </p>
  
                  <h2
                    className="font-display"
                    id="movie-video-dialog-title"
                  >
                    {activeVideo.name}
                  </h2>
                </div>
  
                <button
                  autoFocus
                  className="movie-video-dialog__close"
                  type="button"
                  onClick={closeVideo}
                  aria-label="Close video projection"
                >
                  <X aria-hidden="true" />
                </button>
              </header>
  
              <div className="movie-video-dialog__frame">
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  src={getVideoEmbedUrl(
                    activeVideo.key,
                  )}
                  title={`${activeVideo.name} video`}
                />
              </div>
  
              <footer className="movie-video-dialog__footer">
                <p>
                  Embedded from YouTube using
                  privacy-enhanced playback.
                </p>
  
                <a
                  href={getVideoExternalUrl(
                    activeVideo.key,
                  )}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open on YouTube
                  <ExternalLink aria-hidden="true" />
                </a>
              </footer>
            </div>
          ) : null}
        </dialog>
      </section>
    )
  }