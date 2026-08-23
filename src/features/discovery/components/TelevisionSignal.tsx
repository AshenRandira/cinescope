import type { KeyboardEvent } from 'react'
import {
    useRef,
    useState,
} from 'react'
import {
    Radio,
    RefreshCw,
    Star,
} from 'lucide-react'

import {
    getTmdbBackdropUrl,
    getTmdbImageSrcSet,
} from '../../../lib/tmdb/image'
import type { TelevisionSignal as TelevisionSignalData } from '../data/homeDiscovery'
import './TelevisionSignal.css'

type TelevisionSignalProps = {
    errorMessage?: string
    isEmpty: boolean
    isError: boolean
    isPending: boolean
    onRetry: () => void
    signals: TelevisionSignalData[]
}

function getFirstAirYear(firstAirDate: string): string {
    const year = firstAirDate.slice(0, 4)

    return /^\d{4}$/.test(year) ? year : 'Undated'
}

function formatRating(rating: number): string {
    return rating > 0 ? rating.toFixed(1) : '—'
}

function formatOriginCountry(
    originCountries: string[],
): string {
    if (originCountries.length === 0) {
        return 'Global'
    }

    return originCountries.slice(0, 2).join(' / ')
}

export function TelevisionSignal({
    errorMessage,
    isEmpty,
    isError,
    isPending,
    onRetry,
    signals,
}: TelevisionSignalProps) {
    const [activeSignalIndex, setActiveSignalIndex] =
        useState(0)
    const [activeShowIndex, setActiveShowIndex] =
        useState(0)

    const signalTabRefs =
        useRef<Array<HTMLButtonElement | null>>([])

    function selectSignal(index: number): void {
        setActiveSignalIndex(index)
        setActiveShowIndex(0)
    }

    function handleSignalKeyDown(
        event: KeyboardEvent<HTMLButtonElement>,
        currentIndex: number,
    ): void {
        let nextIndex: number | null = null

        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                nextIndex =
                    (currentIndex + 1) % signals.length
                break

            case 'ArrowLeft':
            case 'ArrowUp':
                nextIndex =
                    (currentIndex - 1 + signals.length) %
                    signals.length
                break

            case 'Home':
                nextIndex = 0
                break

            case 'End':
                nextIndex = signals.length - 1
                break

            default:
                return
        }

        event.preventDefault()
        selectSignal(nextIndex)
        signalTabRefs.current[nextIndex]?.focus()
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
    } else if (isEmpty || signals.length === 0) {
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
                    <Radio
                        aria-hidden="true"
                        className="mx-auto size-6 animate-pulse text-[var(--color-projector)] motion-reduce:animate-none"
                    />

                    <p className="archive-label mt-6">
                        Loading TV collections
                    </p>

                    <p className="mt-3 text-sm leading-7 text-[var(--color-app-muted)]">
                        Loading trending and currently airing series.
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
                        TV collections unavailable
                    </p>

                    <h3 className="font-display mt-4 text-4xl text-[var(--color-app-text)] sm:text-5xl">
                        TV collections could not load.
                    </h3>

                    <p className="mt-5 text-sm leading-7 text-[var(--color-app-muted)]">
                        {errorMessage ??
                            'TMDB did not return the required series.'}
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
                        No results
                    </p>

                    <h3 className="font-display mt-4 text-4xl text-[var(--color-app-text)] sm:text-5xl">
                        No TV collection is available.
                    </h3>

                    <p className="mt-5 text-sm leading-7 text-[var(--color-app-muted)]">
                        The results did not include enough artwork to display this section.
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
        const safeSignalIndex = Math.min(
            activeSignalIndex,
            signals.length - 1,
        )

        const activeSignal = signals[safeSignalIndex]

        const safeShowIndex = Math.min(
            activeShowIndex,
            activeSignal.shows.length - 1,
        )

        const activeShow =
            activeSignal.shows[safeShowIndex]

        const backdropUrl = getTmdbBackdropUrl(
            activeShow.backdrop_path,
            'w1280',
        )

        const backdropSrcSet = getTmdbImageSrcSet(
            activeShow.backdrop_path,
            ['w780', 'w1280'],
        )

        sceneContent = (
            <>
                <div
                    aria-label="Television collections"
                    className="television-signal__tabs border-y border-[var(--color-line-soft)]"
                    role="tablist"
                >
                    {signals.map((signal, index) => {
                        const isActive =
                            index === safeSignalIndex

                        return (
                            <button
                                aria-controls="television-signal-panel"
                                aria-label={`Collection ${signal.index}: ${signal.label}. ${signal.cue}`}
                                aria-selected={isActive}
                                className="television-signal__tab"
                                data-active={isActive}
                                id={`television-signal-${signal.id}`}
                                key={signal.id}
                                onClick={() => {
                                    selectSignal(index)
                                }}
                                onKeyDown={(event) => {
                                    handleSignalKeyDown(event, index)
                                }}
                                ref={(element) => {
                                    signalTabRefs.current[index] = element
                                }}
                                role="tab"
                                tabIndex={isActive ? 0 : -1}
                                type="button"
                            >
                                <span className="flex items-center justify-between gap-4">
                                    <span className="font-mono text-[var(--font-size-caption)] uppercase tracking-[0.18em] text-[var(--color-app-subtle)]">
                                        Collection {signal.index}
                                    </span>

                                    <span className="font-mono text-[var(--font-size-caption)] uppercase tracking-[0.15em] text-[var(--color-projector)]">
                                        {signal.cue}
                                    </span>
                                </span>

                                <span className="mt-5 flex items-center justify-between gap-4">
                                    <span className="text-base font-semibold">
                                        {signal.label}
                                    </span>

                                    <span
                                        aria-hidden="true"
                                        className="television-signal__tab-line"
                                    />
                                </span>
                            </button>
                        )
                    })}
                </div>

                <div
                    aria-labelledby={`television-signal-${activeSignal.id}`}
                    className="television-signal__panel min-h-[46rem] overflow-hidden border-b border-[var(--color-line-soft)]"
                    id="television-signal-panel"
                    role="tabpanel"
                    tabIndex={0}
                >
                    {backdropUrl ? (
                        <img
                            alt=""
                            aria-hidden="true"
                            className="television-signal__backdrop absolute inset-0 size-full object-cover"
                            decoding="async"
                            height={720}
                            key={`television-backdrop-${activeSignal.id}-${activeShow.id}`}
                            loading="lazy"
                            sizes="100vw"
                            src={backdropUrl}
                            srcSet={backdropSrcSet}
                            width={1280}
                        />
                    ) : null}

                    <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,6,0.9)_0%,rgba(5,7,6,0.5)_50%,rgba(5,7,6,0.76)_100%)]"
                    />

                    <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,6,0.05)_0%,rgba(5,7,6,0.14)_55%,rgba(5,7,6,0.9)_100%)]"
                    />

                    <div
                        className="relative z-10 grid min-h-[46rem] lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.55fr)]"
                        key={`television-content-${activeSignal.id}-${activeShow.id}`}
                    >
                        <div className="television-signal__content flex flex-col justify-between px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
                            <div>
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <p className="archive-label text-[var(--color-projector-strong)]">
                                        Featured series
                                    </p>

                                    <p className="inline-flex items-center gap-2 font-mono text-[var(--font-size-caption)] uppercase tracking-[0.15em] text-[var(--color-app-subtle)]">
                                        <Radio
                                            aria-hidden="true"
                                            className="size-3.5 text-[var(--color-projector)]"
                                        />
                                        {activeSignal.cue}
                                    </p>
                                </div>

                                <div
                                    aria-hidden="true"
                                    className="television-signal__frequency-line mt-7"
                                />
                            </div>

                            <div className="mt-20 max-w-5xl">
                                <h3 className="font-display text-balance text-[clamp(3.5rem,8vw,9rem)] leading-[0.84] text-[var(--color-app-text)]">
                                    {activeShow.name}
                                </h3>

                                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs uppercase tracking-[0.14em] text-[var(--color-app-muted)]">
                                    <span>
                                        First aired{' '}
                                        {getFirstAirYear(
                                            activeShow.first_air_date,
                                        )}
                                    </span>

                                    <span
                                        aria-hidden="true"
                                        className="size-1 rounded-full bg-[var(--color-projector)]"
                                    />

                                    <span>
                                        {formatOriginCountry(
                                            activeShow.origin_country,
                                        )}
                                    </span>

                                    <span
                                        aria-hidden="true"
                                        className="size-1 rounded-full bg-[var(--color-projector)]"
                                    />

                                    <span>
                                        {activeShow.original_language}
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
                                            activeShow.vote_average,
                                        )}
                                    </span>
                                </div>

                                <p className="text-pretty mt-7 max-w-3xl text-base leading-8 text-[var(--color-app-muted)] sm:text-lg">
                                    {activeShow.overview ||
                                        'This television record does not yet include a series synopsis.'}
                                </p>

                                <div className="mt-9 grid max-w-3xl gap-6 border-t border-[var(--color-line-soft)] pt-6 sm:grid-cols-2">
                                    <div>
                                        <p className="archive-label">
                                            About this collection
                                        </p>

                                        <p className="mt-3 text-sm leading-7 text-[var(--color-app-muted)]">
                                            {activeSignal.description}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="archive-label">
                                            Source reading
                                        </p>

                                        <p className="mt-3 text-sm leading-7 text-[var(--color-app-muted)]">
                                            {activeSignal.sourceNote}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <aside
                            aria-label="Shows in this television collection"
                            className="border-t border-[var(--color-line-soft)] bg-[color:rgba(5,7,6,0.68)] lg:border-t-0 lg:border-l"
                        >
                            <div className="border-b border-[var(--color-line-soft)] px-5 py-6 sm:px-7">
                                <p className="archive-label">
                                    More series
                                </p>

                                <p className="mt-3 text-sm text-[var(--color-app-muted)]">
                                    {activeSignal.shows.length} series
                                </p>
                            </div>

                            <ol>
                                {activeSignal.shows.map(
                                    (show, index) => {
                                        const isActive =
                                            index === safeShowIndex

                                        return (
                                            <li
                                                className="border-b border-[var(--color-line-soft)]"
                                                key={show.id}
                                            >
                                                <button
                                                    aria-pressed={isActive}
                                                    className="television-signal__record min-h-28 w-full px-5 py-5 pr-20 text-left transition-colors hover:bg-[color:rgba(255,255,255,0.025)] sm:px-7 sm:pr-24"
                                                    data-active={isActive}
                                                    onClick={() => {
                                                        setActiveShowIndex(index)
                                                    }}
                                                    type="button"
                                                >
                                                    <span className="flex items-center justify-between gap-4">
                                                        <span className="font-mono text-[var(--font-size-caption)] uppercase tracking-[0.12em] text-[var(--color-app-subtle)]">
                                                            {getFirstAirYear(
                                                                show.first_air_date,
                                                            )}
                                                        </span>
                                                    </span>

                                                    <span
                                                        className={`mt-4 block text-sm font-semibold leading-5 ${isActive
                                                                ? 'text-[var(--color-app-text)]'
                                                                : 'text-[var(--color-app-muted)]'
                                                            }`}
                                                    >
                                                        {show.name}
                                                    </span>

                                                    <span className="mt-2 block text-xs uppercase tracking-[0.12em] text-[var(--color-app-subtle)]">
                                                        {formatOriginCountry(
                                                            show.origin_country,
                                                        )}
                                                        {' / '}
                                                        {show.original_language}
                                                    </span>
                                                </button>
                                            </li>
                                        )
                                    },
                                )}
                            </ol>
                        </aside>
                    </div>
                </div>
            </>
        )
    }

    return (
        <section
            aria-labelledby="television-signal-title"
            className="television-signal -mx-[var(--layout-gutter)] scroll-mt-24 border-t border-[var(--color-line-soft)] px-[var(--layout-gutter)] py-20 sm:py-24 lg:py-32"
            id="television-signal"
        >
            <div className="mx-auto max-w-[var(--layout-max)]">
                <header className="grid gap-8 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.45fr)] lg:items-end lg:gap-16 lg:pb-16">
                    <div>
                        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-projector)]">
                            TV highlights
                        </p>

                        <h2
                            className="font-display text-balance mt-7 max-w-5xl text-[clamp(3.25rem,7vw,8rem)] leading-[0.86] text-[var(--color-app-text)]"
                            id="television-signal-title"
                        >
                            Stories travel in frequencies.
                        </h2>
                    </div>

                    <div className="border-l border-[var(--color-line-soft)] pl-6">
                        <p className="text-pretty text-sm leading-7 text-[var(--color-app-muted)]">
                            Explore what is trending now and what is airing soon.
                        </p>
                    </div>
                </header>

                {sceneContent}
            </div>
        </section>
    )
}
