import type {
  CSSProperties,
  KeyboardEvent,
} from 'react'
import {
  useRef,
  useState,
} from 'react'
import {
  ArrowRight,
  Compass,
  Languages,
  Star,
} from 'lucide-react'
import { Link } from 'react-router'

import {
  getTmdbBackdropUrl,
  getTmdbPosterUrl,
} from '../../../lib/tmdb/image'
import type { TmdbMovie } from '../../../types/tmdb'

type ArchiveProjectionHeroProps = {
  movies: TmdbMovie[]
}

type ArchiveFrame = 'story' | 'atmosphere' | 'reception'

type AtmosphereStyle = CSSProperties & {
  '--atmosphere-highlight-rgb': string
  '--atmosphere-primary-rgb': string
  '--atmosphere-secondary-rgb': string
  '--atmosphere-shadow-rgb': string
}

const archiveFrames: Array<{
  id: ArchiveFrame
  index: string
  label: string
}> = [
  {
    id: 'story',
    index: '01',
    label: 'Story',
  },
  {
    id: 'atmosphere',
    index: '02',
    label: 'Atmosphere',
  },
  {
    id: 'reception',
    index: '03',
    label: 'Reception',
  },
]

const atmospherePalettes: AtmosphereStyle[] = [
  {
    '--atmosphere-primary-rgb': '126 58 35',
    '--atmosphere-secondary-rgb': '28 74 71',
    '--atmosphere-highlight-rgb': '231 164 83',
    '--atmosphere-shadow-rgb': '5 7 6',
  },
  {
    '--atmosphere-primary-rgb': '54 72 105',
    '--atmosphere-secondary-rgb': '92 51 43',
    '--atmosphere-highlight-rgb': '210 157 92',
    '--atmosphere-shadow-rgb': '4 6 9',
  },
  {
    '--atmosphere-primary-rgb': '76 42 67',
    '--atmosphere-secondary-rgb': '35 74 78',
    '--atmosphere-highlight-rgb': '224 173 97',
    '--atmosphere-shadow-rgb': '6 5 8',
  },
  {
    '--atmosphere-primary-rgb': '84 70 39',
    '--atmosphere-secondary-rgb': '36 65 57',
    '--atmosphere-highlight-rgb': '235 181 83',
    '--atmosphere-shadow-rgb': '7 7 5',
  },
]

function getReleaseYear(releaseDate: string): string {
  return releaseDate ? releaseDate.slice(0, 4) : 'Year unknown'
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en', {
    maximumFractionDigits: 1,
    notation: 'compact',
  }).format(value)
}

function getTitleSizeClass(title: string): string {
  if (title.length > 30) {
    return 'text-[clamp(3.25rem,6vw,6.75rem)]'
  }

  if (title.length > 18) {
    return 'text-[clamp(3.75rem,7.5vw,8rem)]'
  }

  return 'text-[clamp(4.5rem,9.5vw,10rem)]'
}

type FramePanelProps = {
  frame: ArchiveFrame
  movie: TmdbMovie
}

function FramePanel({
  frame,
  movie,
}: FramePanelProps) {
  if (frame === 'story') {
    return (
      <div
        aria-labelledby="archive-frame-tab-story"
        className="scene-copy"
        id="archive-frame-panel"
        role="tabpanel"
        tabIndex={0}
      >
        <p className="max-w-2xl text-pretty text-base leading-8 text-[var(--color-paper-200)] md:text-lg">
          {movie.overview ||
            'A featured story selected from the living CineScope archive.'}
        </p>
      </div>
    )
  }

  if (frame === 'atmosphere') {
    return (
      <div
        aria-labelledby="archive-frame-tab-atmosphere"
        className="scene-copy grid max-w-2xl gap-px border-y border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-3"
        id="archive-frame-panel"
        role="tabpanel"
        tabIndex={0}
      >
        <div className="bg-[color:rgb(7_8_6/0.74)] px-4 py-5 backdrop-blur-sm">
          <p className="archive-label">Release frame</p>

          <p className="font-display mt-3 text-4xl italic text-[var(--color-projector)]">
            {getReleaseYear(movie.release_date)}
          </p>
        </div>

        <div className="bg-[color:rgb(7_8_6/0.74)] px-4 py-5 backdrop-blur-sm">
          <p className="archive-label">Original voice</p>

          <p className="mt-4 flex items-center gap-2 text-sm font-semibold uppercase text-[var(--color-paper-100)]">
            <Languages
              aria-hidden="true"
              className="size-4 text-[var(--color-projector)]"
            />
            {movie.original_language}
          </p>
        </div>

        <div className="bg-[color:rgb(7_8_6/0.74)] px-4 py-5 backdrop-blur-sm">
          <p className="archive-label">Current signal</p>

          <p className="font-display mt-3 text-4xl italic text-[var(--color-paper-100)]">
            {formatCompactNumber(movie.popularity)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      aria-labelledby="archive-frame-tab-reception"
      className="scene-copy flex max-w-2xl flex-wrap items-end gap-8 border-y border-[var(--color-line)] py-5"
      id="archive-frame-panel"
      role="tabpanel"
      tabIndex={0}
    >
      <div>
        <p className="archive-label">Audience reading</p>

        <p className="font-display mt-2 flex items-center gap-3 text-[clamp(4rem,7vw,7rem)] italic leading-none text-[var(--color-projector)]">
          {movie.vote_average.toFixed(1)}

          <Star
            aria-hidden="true"
            className="size-5 fill-current"
          />
        </p>
      </div>

      <div className="pb-2">
        <p className="archive-label">Recorded responses</p>

        <p className="mt-3 text-lg font-semibold text-[var(--color-paper-100)]">
          {formatCompactNumber(movie.vote_count)}
        </p>
      </div>

      <div className="pb-2">
        <p className="archive-label">Archive position</p>

        <p className="mt-3 text-lg font-semibold text-[var(--color-paper-100)]">
          Popular now
        </p>
      </div>
    </div>
  )
}

export function ArchiveProjectionHero({
  movies,
}: ArchiveProjectionHeroProps) {
  const [activeMovieIndex, setActiveMovieIndex] = useState(0)
  const [activeFrame, setActiveFrame] =
    useState<ArchiveFrame>('story')

  const frameTabRefs =
    useRef<Array<HTMLButtonElement | null>>([])

  const activeMovie = movies[activeMovieIndex]

  const atmosphereStyle =
    atmospherePalettes[
      activeMovieIndex % atmospherePalettes.length
    ]

  const backdropUrl = getTmdbBackdropUrl(
    activeMovie.backdrop_path,
  )

  const posterUrl = getTmdbPosterUrl(
    activeMovie.poster_path,
  )

  function handleFrameKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    let nextIndex: number | null = null

    switch (event.key) {
      case 'ArrowRight':
        nextIndex =
          (currentIndex + 1) % archiveFrames.length
        break

      case 'ArrowLeft':
        nextIndex =
          (currentIndex - 1 + archiveFrames.length) %
          archiveFrames.length
        break

      case 'Home':
        nextIndex = 0
        break

      case 'End':
        nextIndex = archiveFrames.length - 1
        break

      default:
        return
    }

    event.preventDefault()

    const nextFrame = archiveFrames[nextIndex]

    setActiveFrame(nextFrame.id)
    frameTabRefs.current[nextIndex]?.focus()
  }

  function selectMovie(index: number) {
    setActiveMovieIndex(index)
    setActiveFrame('story')
  }

  return (
    <section
      aria-labelledby="archive-projection-title"
      className="relative isolate -mx-[var(--layout-gutter)] -mt-8 overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-ink-950)] md:-mt-10"
      style={atmosphereStyle}
    >
      <div className="relative isolate min-h-[calc(100svh-var(--layout-header-height))] overflow-hidden">
        {backdropUrl ? (
          <img
            alt=""
            aria-hidden="true"
            className="scene-backdrop absolute inset-0 -z-40 h-full w-full object-cover object-center"
            key={`backdrop-${activeMovie.id}`}
            src={backdropUrl}
          />
        ) : null}

        <div
          aria-hidden="true"
          className="absolute inset-0 -z-30 bg-[linear-gradient(90deg,rgba(7,8,6,0.99)_0%,rgba(7,8,6,0.94)_36%,rgba(7,8,6,0.4)_72%,rgba(7,8,6,0.82)_100%)]"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(7,8,6,0.2)_0%,rgba(7,8,6,0.12)_48%,rgba(7,8,6,0.96)_100%)]"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_73%_34%,rgb(var(--atmosphere-highlight-rgb)/0.18),transparent_31rem)]"
        />

        <div className="mx-auto flex min-h-[calc(100svh-var(--layout-header-height))] max-w-[var(--layout-max)] flex-col px-[var(--layout-gutter)]">
          <div className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.4fr)] lg:py-20">
            <div className="relative z-10 min-w-0">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <p className="archive-label text-[var(--color-projector)]">
                  Now projecting
                </p>

                <span
                  aria-hidden="true"
                  className="h-px w-14 bg-[var(--color-projector)]"
                />

                <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[var(--color-paper-500)]">
                  Reel{' '}
                  {String(activeMovieIndex + 1).padStart(2, '0')}
                  {' / '}
                  {String(movies.length).padStart(2, '0')}
                </p>
              </div>

              <div
                aria-live="polite"
                className="scene-copy"
                key={`title-${activeMovie.id}`}
              >
                <h1
                  className={`font-display mt-7 max-w-[10ch] leading-[0.8] text-[var(--color-paper-100)] ${getTitleSizeClass(
                    activeMovie.title,
                  )}`}
                  id="archive-projection-title"
                >
                  {activeMovie.title}
                </h1>
              </div>

              <div
                aria-label="Featured title frames"
                aria-orientation="horizontal"
                className="mt-9 flex max-w-2xl border-y border-[var(--color-line)]"
                role="tablist"
              >
                {archiveFrames.map((frame, frameIndex) => {
                  const isActive =
                    activeFrame === frame.id

                  return (
                    <button
                      aria-controls="archive-frame-panel"
                      aria-selected={isActive}
                      className={`group relative flex min-h-16 flex-1 items-center gap-3 px-3 text-left transition-colors duration-[var(--duration-micro)] sm:px-4 ${
                        isActive
                          ? 'text-[var(--color-paper-100)]'
                          : 'text-[var(--color-paper-500)] hover:text-[var(--color-paper-100)]'
                      }`}
                      id={`archive-frame-tab-${frame.id}`}
                      key={frame.id}
                      onClick={() => {
                        setActiveFrame(frame.id)
                      }}
                      onKeyDown={(event) => {
                        handleFrameKeyDown(
                          event,
                          frameIndex,
                        )
                      }}
                      ref={(element) => {
                        frameTabRefs.current[frameIndex] =
                          element
                      }}
                      role="tab"
                      tabIndex={isActive ? 0 : -1}
                      type="button"
                    >
                      <span className="font-mono text-[0.58rem] tracking-[0.14em] text-[var(--color-projector)]">
                        {frame.index}
                      </span>

                      <span className="text-xs font-semibold uppercase tracking-[0.12em] sm:text-sm">
                        {frame.label}
                      </span>

                      <span
                        aria-hidden="true"
                        className={`absolute inset-x-3 bottom-0 h-px origin-left bg-[var(--color-projector)] transition-transform duration-[var(--duration-interface)] ${
                          isActive
                            ? 'scale-x-100'
                            : 'scale-x-0 group-hover:scale-x-100'
                        }`}
                      />
                    </button>
                  )
                })}
              </div>

              <div
                aria-live="polite"
                className="mt-7 min-h-36"
                key={`${activeMovie.id}-${activeFrame}`}
              >
                <FramePanel
                  frame={activeFrame}
                  movie={activeMovie}
                />
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  className="group inline-flex min-h-12 items-center gap-3 bg-[var(--color-projector)] px-6 text-sm font-bold text-[var(--color-ink-950)] transition-colors hover:bg-[var(--color-projector-strong)]"
                  to="/movies"
                >
                  Open movie archive

                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-[var(--duration-micro)] group-hover:translate-x-1"
                  />
                </Link>

                <Link
                  className="group inline-flex min-h-12 items-center gap-3 border border-[var(--color-line-strong)] px-6 text-sm font-bold text-[var(--color-paper-100)] transition-colors hover:border-[var(--color-projector)]"
                  to="/discover"
                >
                  <Compass
                    aria-hidden="true"
                    className="size-4 text-[var(--color-projector)]"
                  />

                  Continue discovery
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-[min(72vw,20rem)] lg:w-full lg:max-w-sm">
              <div
                aria-hidden="true"
                className="absolute -inset-7 border border-[var(--color-line-soft)]"
              />

              <div
                aria-hidden="true"
                className="absolute -bottom-10 -left-10 -z-10 h-3/4 w-3/4 bg-[rgb(var(--atmosphere-primary-rgb)/0.2)] blur-3xl"
              />

              <div
                className="scene-poster"
                key={`poster-frame-${activeMovie.id}`}
              >
                {posterUrl ? (
                  <img
                    alt={`${activeMovie.title} poster`}
                    className="aspect-[2/3] w-full rotate-[1.5deg] object-cover shadow-[var(--shadow-elevated)] transition-transform duration-[var(--duration-scene)] ease-[var(--ease-focus)] hover:rotate-0 hover:scale-[1.012]"
                    height="750"
                    src={posterUrl}
                    width="500"
                  />
                ) : (
                  <div className="grid aspect-[2/3] place-items-center border border-[var(--color-line)] bg-[var(--color-ink-800)]">
                    <p className="archive-label">
                      Artwork unavailable
                    </p>
                  </div>
                )}
              </div>

              <div className="absolute -bottom-7 -right-5 border border-[var(--color-line)] bg-[color:rgb(7_8_6/0.9)] px-5 py-4 backdrop-blur-lg">
                <p className="archive-label">
                  Selected frame
                </p>

                <p className="font-display mt-2 text-3xl italic text-[var(--color-projector)]">
                  {
                    archiveFrames.find(
                      (frame) =>
                        frame.id === activeFrame,
                    )?.index
                  }
                  {' / 03'}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--color-line)]">
            <div
              aria-label="Featured movie reel"
              className="flex overflow-x-auto"
              role="group"
            >
              {movies.map((movie, index) => {
                const isActive =
                  index === activeMovieIndex

                return (
                  <button
                    aria-label={`Select ${movie.title} as the featured movie`}
                    aria-pressed={isActive}
                    className={`group relative min-w-[14rem] flex-1 border-r border-[var(--color-line)] px-5 py-5 text-left transition-colors duration-[var(--duration-interface)] last:border-r-0 ${
                      isActive
                        ? 'bg-[color:rgb(245_241_233/0.055)]'
                        : 'hover:bg-[color:rgb(245_241_233/0.025)]'
                    }`}
                    key={movie.id}
                    onClick={() => {
                      selectMovie(index)
                    }}
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-5 top-0 h-px origin-left bg-[var(--color-projector)] transition-transform duration-[var(--duration-interface)] ${
                        isActive
                          ? 'scale-x-100'
                          : 'scale-x-0 group-hover:scale-x-100'
                      }`}
                    />

                    <span className="flex items-center justify-between gap-4">
                      <span className="font-mono text-[0.58rem] tracking-[0.14em] text-[var(--color-projector)]">
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <span className="archive-label">
                        {getReleaseYear(
                          movie.release_date,
                        )}
                      </span>
                    </span>

                    <span className="mt-3 block truncate text-sm font-bold text-[var(--color-paper-100)]">
                      {movie.title}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}