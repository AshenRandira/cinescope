import type { KeyboardEvent } from 'react'
import {
    useRef,
    useState,
} from 'react'
import {
    CalendarDays,
    RefreshCw,
    Star,
} from 'lucide-react'

import {
    getTmdbBackdropUrl,
    getTmdbImageSrcSet,
} from '../../../lib/tmdb/image'
import type { TemporalStation } from '../data/homeDiscovery'
import './TemporalCinemaMap.css'

type TemporalCinemaMapProps = {
    errorMessage?: string
    isEmpty: boolean
    isError: boolean
    isPending: boolean
    onRetry: () => void
    stations: TemporalStation[]
}

function getReleaseYear(releaseDate: string): string {
    const year = releaseDate.slice(0, 4)

    return /^\d{4}$/.test(year) ? year : '—'
}

function formatReleaseDate(releaseDate: string): string {
    const date = new Date(`${releaseDate}T00:00:00`)

    if (Number.isNaN(date.getTime())) {
        return 'Release date unavailable'
    }

    return new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(date)
}

function formatRating(rating: number): string {
    return rating > 0 ? rating.toFixed(1) : '—'
}

export function TemporalCinemaMap({
    errorMessage,
    isEmpty,
    isError,
    isPending,
    onRetry,
    stations,
}: TemporalCinemaMapProps) {
    const [activeStationIndex, setActiveStationIndex] =
        useState(1)
    const [activeMovieIndex, setActiveMovieIndex] =
        useState(0)

    const stationTabRefs =
        useRef<Array<HTMLButtonElement | null>>([])

    function selectStation(index: number): void {
        setActiveStationIndex(index)
        setActiveMovieIndex(0)
    }

    function handleStationKeyDown(
        event: KeyboardEvent<HTMLButtonElement>,
        currentIndex: number,
    ): void {
        let nextIndex: number | null = null

        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                nextIndex = (currentIndex + 1) % stations.length
                break

            case 'ArrowLeft':
            case 'ArrowUp':
                nextIndex =
                    (currentIndex - 1 + stations.length) %
                    stations.length
                break

            case 'Home':
                nextIndex = 0
                break

            case 'End':
                nextIndex = stations.length - 1
                break

            default:
                return
        }

        event.preventDefault()
        selectStation(nextIndex)
        stationTabRefs.current[nextIndex]?.focus()
    }

    let sceneState:
        | 'empty'
        | 'error'
        | 'loading'
        | 'ready'

    if (isPending) {
        sceneState = 'loading'
    } else if (isError) {
        sceneState = 'error'
    } else if (isEmpty || stations.length === 0) {
        sceneState = 'empty'
    } else {
        sceneState = 'ready'
    }

    let sceneContent

    if (sceneState === 'loading') {
        sceneContent = (
            <div
                aria-busy="true"
                aria-live="polite"
                className="grid min-h-[36rem] place-items-center border-y border-[var(--color-line-soft)]"
            >
                <div className="max-w-md text-center">
                    <span
                        aria-hidden="true"
                        className="mx-auto block h-px w-28 animate-pulse bg-[var(--color-projector)] motion-reduce:animate-none"
                    />

                    <p className="archive-label mt-6">
                        Plotting cinema through time
                    </p>

                    <p className="mt-3 text-sm leading-7 text-[var(--color-app-muted)]">
                        Loading older, trending, theatrical, and upcoming movies.
                    </p>
                </div>
            </div>
        )
    } else if (sceneState === 'error') {
        sceneContent = (
            <div
                aria-live="assertive"
                className="grid min-h-[36rem] place-items-center border-y border-[var(--color-line-soft)]"
                role="alert"
            >
                <div className="max-w-lg text-center">
                    <p className="archive-label text-[var(--color-app-error)]">
                        Release timeline unavailable
                    </p>

                    <h3 className="font-display mt-4 text-4xl text-[var(--color-app-text)] sm:text-5xl">
                        Release timeline could not load.
                    </h3>

                    <p className="mt-5 text-sm leading-7 text-[var(--color-app-muted)]">
                        {errorMessage ??
                            'TMDB did not return the required movies.'}
                    </p>

                    <button
                        className="mt-8 inline-flex min-h-11 items-center gap-3 border-b border-[var(--color-projector)] pb-2 text-sm font-semibold text-[var(--color-app-text)] transition-colors hover:text-[var(--color-projector-strong)]"
                        onClick={onRetry}
                        type="button"
                    >
                        <RefreshCw
                            aria-hidden="true"
                            className="size-4"
                        />
                        Try again
                    </button>
                </div>
            </div>
        )
    } else if (sceneState === 'empty') {
        sceneContent = (
            <div className="grid min-h-[36rem] place-items-center border-y border-dashed border-[var(--color-line-soft)]">
                <div className="max-w-lg text-center">
                    <p className="archive-label">
                        Temporal archive note
                    </p>

                    <h3 className="font-display mt-4 text-4xl text-[var(--color-app-text)] sm:text-5xl">
                        No release group is available.
                    </h3>

                    <p className="mt-5 text-sm leading-7 text-[var(--color-app-muted)]">
                        The results did not include enough dates and artwork to display this section.
                    </p>

                    <button
                        className="mt-8 border-b border-[var(--color-projector)] pb-2 text-sm font-semibold text-[var(--color-app-text)] transition-colors hover:text-[var(--color-projector-strong)]"
                        onClick={onRetry}
                        type="button"
                    >
                        Try again
                    </button>
                </div>
            </div>
        )
    } else {
        const safeStationIndex = Math.min(
            activeStationIndex,
            stations.length - 1,
        )

        const activeStation =
            stations[safeStationIndex]

        const safeMovieIndex = Math.min(
            activeMovieIndex,
            activeStation.movies.length - 1,
        )

        const activeMovie =
            activeStation.movies[safeMovieIndex]

        const backdropUrl = getTmdbBackdropUrl(
            activeMovie.backdrop_path,
            'w1280',
        )

        const backdropSrcSet = getTmdbImageSrcSet(
            activeMovie.backdrop_path,
            ['w780', 'w1280'],
        )

        sceneContent = (
            <>
                <div
                    aria-label="Cinema time stations"
                    className="temporal-map__track border-y border-[var(--color-line-soft)]"
                    role="tablist"
                >
                    {stations.map((station, index) => {
                        const isActive =
                            index === safeStationIndex

                        return (
                            <button
                                aria-controls="temporal-map-panel"
                                aria-selected={isActive}
                                className="temporal-map__station text-[var(--color-app-muted)]"
                                data-active={isActive}
                                id={`temporal-station-${station.id}`}
                                key={station.id}
                                onClick={() => {
                                    selectStation(index)
                                }}
                                onKeyDown={(event) => {
                                    handleStationKeyDown(event, index)
                                }}
                                ref={(element) => {
                                    stationTabRefs.current[index] =
                                        element
                                }}
                                role="tab"
                                tabIndex={isActive ? 0 : -1}
                                type="button"
                            >
                                <span className="flex items-center justify-between gap-4">
                                    <span className="font-mono text-[var(--font-size-caption)] uppercase tracking-[0.18em] text-[var(--color-app-subtle)]">
                                        Station {station.index}
                                    </span>

                                    <span className="font-mono text-[var(--font-size-caption)] uppercase tracking-[0.15em] text-[var(--color-projector)]">
                                        {station.cue}
                                    </span>
                                </span>

                                <span
                                    aria-hidden="true"
                                    className="temporal-map__node block"
                                />

                                <span className="mt-4 block text-sm font-semibold">
                                    {station.label}
                                </span>
                            </button>
                        )
                    })}
                </div>

                <div
                    aria-labelledby={`temporal-station-${activeStation.id}`}
                    className="relative min-h-[46rem] overflow-hidden border-b border-[var(--color-line-soft)]"
                    id="temporal-map-panel"
                    role="tabpanel"
                    tabIndex={0}
                >
                    {backdropUrl ? (
                        <img
                            alt=""
                            aria-hidden="true"
                            className="temporal-map__backdrop absolute inset-0 size-full object-cover"
                            decoding="async"
                            height={720}
                            key={`temporal-backdrop-${activeStation.id}-${activeMovie.id}`}
                            loading="lazy"
                            sizes="100vw"
                            src={backdropUrl}
                            srcSet={backdropSrcSet}
                            width={1280}
                        />
                    ) : null}

                    <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,6,0.93)_0%,rgba(5,7,6,0.78)_31%,rgba(5,7,6,0.32)_68%,rgba(5,7,6,0.64)_100%)]"
                    />

                    <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,6,0.08)_0%,rgba(5,7,6,0.14)_58%,rgba(5,7,6,0.88)_100%)]"
                    />

                    <div
                        className="temporal-map__content relative z-10 grid min-h-[46rem] lg:grid-cols-[minmax(15rem,0.45fr)_minmax(0,1fr)]"
                        key={`temporal-content-${activeStation.id}-${activeMovie.id}`}
                    >
                        <aside className="flex flex-col justify-between border-b border-[var(--color-line-soft)] px-5 py-10 sm:px-8 lg:border-r lg:border-b-0 lg:px-10 lg:py-14">
                            <div>
                                <p className="archive-label">
                                    Temporal coordinate
                                </p>

                                <p className="temporal-map__year mt-12">
                                    {getReleaseYear(
                                        activeMovie.release_date,
                                    )}
                                </p>

                                <p className="mt-6 inline-flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-[var(--color-app-muted)]">
                                    <CalendarDays
                                        aria-hidden="true"
                                        className="size-4 text-[var(--color-projector)]"
                                    />
                                    {formatReleaseDate(
                                        activeMovie.release_date,
                                    )}
                                </p>
                            </div>

                            <div className="mt-12 border-t border-[var(--color-line-soft)] pt-6">
                                <p className="archive-label">
                                    About this group
                                </p>

                                <p className="mt-3 text-sm leading-7 text-[var(--color-app-muted)]">
                                    {activeStation.sourceNote}
                                </p>
                            </div>
                        </aside>

                        <div className="flex flex-col justify-end px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
                            <div className="max-w-5xl">
                                <p className="archive-label text-[var(--color-projector-strong)]">
                                    {activeStation.label}
                                </p>

                                <h3 className="font-display text-balance mt-5 text-[clamp(3.5rem,8vw,8.75rem)] leading-[0.84] text-[var(--color-app-text)]">
                                    {activeMovie.title}
                                </h3>

                                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs uppercase tracking-[0.14em] text-[var(--color-app-muted)]">
                                    <span>
                                        {activeMovie.original_language}
                                    </span>

                                    <span
                                        aria-hidden="true"
                                        className="size-1 rounded-full bg-[var(--color-projector)]"
                                    />

                                    <span className="inline-flex items-center gap-2">
                                        <Star
                                            aria-hidden="true"
                                            className="size-3.5 fill-current text-[var(--color-app-rating)]"
                                        />
                                        {formatRating(
                                            activeMovie.vote_average,
                                        )}
                                    </span>

                                    <span
                                        aria-hidden="true"
                                        className="size-1 rounded-full bg-[var(--color-projector)]"
                                    />

                                    <span>
                                        {activeStation.cue}
                                    </span>
                                </div>

                                <p className="text-pretty mt-7 max-w-3xl text-base leading-8 text-[var(--color-app-muted)] sm:text-lg">
                                    {activeMovie.overview ||
                                        'This temporal record does not yet include a story synopsis.'}
                                </p>

                                <p className="mt-6 max-w-2xl border-l border-[var(--color-projector)] pl-5 text-sm leading-7 text-[var(--color-app-muted)]">
                                    {activeStation.description}
                                </p>
                            </div>

                            <ol className="mt-12 grid border-y border-[var(--color-line-soft)] md:grid-cols-3">
                                {activeStation.movies.map(
                                    (movie, index) => {
                                        const isActive =
                                            index === safeMovieIndex

                                        return (
                                            <li
                                                className="border-b border-[var(--color-line-soft)] last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0"
                                                key={movie.id}
                                            >
                                                <button
                                                    aria-pressed={isActive}
                                                    className="temporal-map__record min-h-28 w-full px-4 py-5 text-left transition-colors hover:bg-[color:rgba(255,255,255,0.025)]"
                                                    data-active={isActive}
                                                    onClick={() => {
                                                        setActiveMovieIndex(index)
                                                    }}
                                                    type="button"
                                                >
                                                    <span className="flex items-center justify-between gap-4">
                                                        <span className="font-mono text-[var(--font-size-caption)] uppercase tracking-[0.12em] text-[var(--color-app-subtle)]">
                                                            {getReleaseYear(
                                                                movie.release_date,
                                                            )}
                                                        </span>
                                                    </span>

                                                    <span
                                                        className={`mt-4 block text-sm font-semibold leading-5 ${isActive
                                                                ? 'text-[var(--color-app-text)]'
                                                                : 'text-[var(--color-app-muted)]'
                                                            }`}
                                                    >
                                                        {movie.title}
                                                    </span>
                                                </button>
                                            </li>
                                        )
                                    },
                                )}
                            </ol>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    return (
        <section
            aria-labelledby="temporal-map-title"
            className="temporal-map -mx-[var(--layout-gutter)] scroll-mt-24 border-t border-[var(--color-line-soft)] px-[var(--layout-gutter)] py-20 sm:py-24 lg:py-32"
            id="temporal-cinema-map"
        >
            <div className="mx-auto max-w-[var(--layout-max)]">
                <header className="grid gap-8 pb-12 lg:grid-cols-[minmax(14rem,0.4fr)_minmax(0,1fr)] lg:items-end lg:gap-14 lg:pb-16">
                    <div>
                        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-projector)]">
                            Explore by era
                        </p>

                        <p className="mt-5 max-w-xs text-sm leading-7 text-[var(--color-app-muted)]">
                            Explore older, current, theatrical, and upcoming movies.
                        </p>
                    </div>

                    <h2
                        className="font-display text-balance max-w-5xl text-[clamp(3.25rem,7vw,8rem)] leading-[0.86] text-[var(--color-app-text)]"
                        id="temporal-map-title"
                    >
                        The archive is always moving.
                    </h2>
                </header>

                {sceneContent}
            </div>
        </section>
    )
}
