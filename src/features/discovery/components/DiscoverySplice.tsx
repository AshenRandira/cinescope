import type { KeyboardEvent } from 'react'
import {
    useRef,
    useState,
} from 'react'
import {
    RefreshCw,
    Star,
} from 'lucide-react'

import {
    getTmdbBackdropUrl,
    getTmdbImageSrcSet,
    getTmdbPosterUrl,
} from '../../../lib/tmdb/image'
import type { DiscoveryCut } from '../data/homeDiscovery'
import './DiscoverySplice.css'

type DiscoverySpliceProps = {
    cuts: DiscoveryCut[]
    errorMessage?: string
    isEmpty: boolean
    isError: boolean
    isPending: boolean
    onRetry: () => void
}

function getReleaseYear(releaseDate: string): string {
    const year = releaseDate.slice(0, 4)

    return /^\d{4}$/.test(year) ? year : 'Undated'
}

function formatRating(rating: number): string {
    return rating > 0 ? rating.toFixed(1) : '—'
}

export function DiscoverySplice({
    cuts,
    errorMessage,
    isEmpty,
    isError,
    isPending,
    onRetry,
}: DiscoverySpliceProps) {
    const [activeCutIndex, setActiveCutIndex] = useState(0)
    const [activeMovieIndex, setActiveMovieIndex] = useState(0)

    const cutTabRefs =
        useRef<Array<HTMLButtonElement | null>>([])

    function selectCut(index: number): void {
        setActiveCutIndex(index)
        setActiveMovieIndex(0)
    }

    function handleCutKeyDown(
        event: KeyboardEvent<HTMLButtonElement>,
        currentIndex: number,
    ): void {
        let nextIndex: number | null = null

        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                nextIndex = (currentIndex + 1) % cuts.length
                break

            case 'ArrowLeft':
            case 'ArrowUp':
                nextIndex =
                    (currentIndex - 1 + cuts.length) % cuts.length
                break

            case 'Home':
                nextIndex = 0
                break

            case 'End':
                nextIndex = cuts.length - 1
                break

            default:
                return
        }

        event.preventDefault()
        selectCut(nextIndex)
        cutTabRefs.current[nextIndex]?.focus()
    }

    const sceneState = isPending
        ? 'loading'
        : isError
            ? 'error'
            : isEmpty || cuts.length === 0
                ? 'empty'
                : 'ready'

    let sceneContent

    if (sceneState === 'loading') {
        sceneContent = (
            <div
                aria-busy="true"
                aria-live="polite"
                className="grid min-h-[34rem] place-items-center border-y border-[var(--color-line-soft)]"
            >
                <div className="max-w-md text-center">
                    <span
                        aria-hidden="true"
                        className="mx-auto block h-px w-24 animate-pulse bg-[var(--color-projector)] motion-reduce:animate-none"
                    />

                    <p className="archive-label mt-6">
                        Assembling editorial cuts
                    </p>

                    <p className="mt-3 text-sm leading-7 text-[var(--color-app-muted)]">
                        Loading themed movie collections from TMDB.
                    </p>
                </div>
            </div>
        )
    } else if (sceneState === 'error') {
        sceneContent = (
            <div
                aria-live="assertive"
                className="grid min-h-[34rem] place-items-center border-y border-[var(--color-line-soft)]"
                role="alert"
            >
                <div className="max-w-lg text-center">
                    <p className="archive-label text-[var(--color-app-error)]">
                        Collections unavailable
                    </p>

                    <h3 className="font-display mt-4 text-4xl text-[var(--color-app-text)] sm:text-5xl">
                        Collections could not load.
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
            <div className="grid min-h-[34rem] place-items-center border-y border-dashed border-[var(--color-line-soft)]">
                <div className="max-w-lg text-center">
                    <p className="archive-label">Archive note</p>

                    <h3 className="font-display mt-4 text-4xl text-[var(--color-app-text)] sm:text-5xl">
                        No movie collection is available.
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
        const safeCutIndex = Math.min(
            activeCutIndex,
            cuts.length - 1,
        )

        const activeCut = cuts[safeCutIndex]

        const safeMovieIndex = Math.min(
            activeMovieIndex,
            activeCut.movies.length - 1,
        )

        const activeMovie = activeCut.movies[safeMovieIndex]

        const backdropUrl = getTmdbBackdropUrl(
            activeMovie.backdrop_path,
            'w1280',
        )

        const posterUrl = getTmdbPosterUrl(
            activeMovie.poster_path,
            'w500',
        )

        const backdropSrcSet = getTmdbImageSrcSet(
            activeMovie.backdrop_path,
            ['w780', 'w1280'],
        )

        const posterSrcSet = getTmdbImageSrcSet(
            activeMovie.poster_path,
            ['w342', 'w500', 'w780'],
        )

        sceneContent = (
            <>
                <div
                    aria-label="Editorial discovery cuts"
                    className="grid border-y border-[var(--color-line-soft)] md:grid-cols-3"
                    role="tablist"
                >
                    {cuts.map((cut, index) => {
                        const isActive = index === safeCutIndex

                        return (
                            <button
                                aria-controls="discovery-splice-panel"
                                aria-selected={isActive}
                                className={`group min-h-28 border-[var(--color-line-soft)] px-5 py-5 text-left transition-colors md:border-r md:last:border-r-0 ${isActive
                                        ? 'bg-[color:rgba(213,164,92,0.08)] text-[var(--color-app-text)]'
                                        : 'text-[var(--color-app-muted)] hover:bg-[color:rgba(255,255,255,0.025)] hover:text-[var(--color-app-text)]'
                                    }`}
                                id={`discovery-cut-${cut.id}`}
                                key={cut.id}
                                onClick={() => {
                                    selectCut(index)
                                }}
                                onKeyDown={(event) => {
                                    handleCutKeyDown(event, index)
                                }}
                                ref={(element) => {
                                    cutTabRefs.current[index] = element
                                }}
                                role="tab"
                                tabIndex={isActive ? 0 : -1}
                                type="button"
                            >
                                <span className="flex items-center justify-between gap-4">
                                    <span className="font-mono text-[var(--font-size-caption)] uppercase tracking-[0.18em] text-[var(--color-app-subtle)]">
                                        Cut {cut.index}
                                    </span>

                                    <span
                                        aria-hidden="true"
                                        className={`h-px transition-[width,background-color] ${isActive
                                                ? 'w-14 bg-[var(--color-projector)]'
                                                : 'w-7 bg-[var(--color-line)] group-hover:w-10'
                                            }`}
                                    />
                                </span>

                                <span className="mt-4 block text-base font-semibold tracking-[-0.01em]">
                                    {cut.label}
                                </span>
                            </button>
                        )
                    })}
                </div>

                <div
                    aria-labelledby={`discovery-cut-${activeCut.id}`}
                    className="relative min-h-[48rem] overflow-hidden border-b border-[var(--color-line-soft)]"
                    id="discovery-splice-panel"
                    role="tabpanel"
                    tabIndex={0}
                >
                    {backdropUrl ? (
                        <img
                            alt=""
                            aria-hidden="true"
                            className="discovery-splice__backdrop absolute inset-0 size-full object-cover"
                            decoding="async"
                            height={720}
                            key={`backdrop-${activeCut.id}-${activeMovie.id}`}
                            loading="lazy"
                            sizes="100vw"
                            src={backdropUrl}
                            srcSet={backdropSrcSet}
                            width={1280}
                        />
                    ) : null}

                    <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,6,0.92)_0%,rgba(5,7,6,0.74)_42%,rgba(5,7,6,0.3)_72%,rgba(5,7,6,0.66)_100%)]"
                    />

                    <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,6,0.1)_0%,rgba(5,7,6,0.16)_55%,rgba(5,7,6,0.88)_100%)]"
                    />

                    <div className="relative z-10 grid min-h-[48rem] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(13rem,0.45fr)_minmax(16rem,0.65fr)] lg:items-end lg:gap-12 lg:px-12 lg:py-16">
                        <div
                            className="discovery-splice__reveal self-center lg:self-end"
                            key={`copy-${activeCut.id}-${activeMovie.id}`}
                        >
                            <p className="archive-label text-[var(--color-projector-strong)]">
                                {activeCut.label} / Selected frame{' '}
                                {String(safeMovieIndex + 1).padStart(2, '0')}
                            </p>

                            <h3 className="font-display text-balance mt-5 max-w-4xl text-[clamp(3.35rem,7.6vw,8.4rem)] leading-[0.84] text-[var(--color-app-text)]">
                                {activeMovie.title}
                            </h3>

                            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs uppercase tracking-[0.14em] text-[var(--color-app-muted)]">
                                <span>
                                    {getReleaseYear(activeMovie.release_date)}
                                </span>

                                <span
                                    aria-hidden="true"
                                    className="size-1 rounded-full bg-[var(--color-projector)]"
                                />

                                <span>{activeMovie.original_language}</span>

                                <span
                                    aria-hidden="true"
                                    className="size-1 rounded-full bg-[var(--color-projector)]"
                                />

                                <span className="inline-flex items-center gap-2">
                                    <Star
                                        aria-hidden="true"
                                        className="size-3.5 fill-current text-[var(--color-app-rating)]"
                                    />
                                    {formatRating(activeMovie.vote_average)}
                                </span>
                            </div>

                            <p className="text-pretty mt-7 max-w-2xl text-base leading-8 text-[var(--color-app-muted)] sm:text-lg">
                                {activeMovie.overview ||
                                    'This archive record does not yet include a story synopsis.'}
                            </p>

                            <div className="mt-10 grid max-w-2xl gap-5 border-t border-[var(--color-line-soft)] pt-6 sm:grid-cols-2">
                                <div>
                                    <p className="archive-label">
                                        Editorial premise
                                    </p>

                                    <p className="mt-3 text-sm leading-7 text-[var(--color-app-muted)]">
                                        {activeCut.description}
                                    </p>
                                </div>

                                <div>
                                    <p className="archive-label">
                                        Selection method
                                    </p>

                                    <p className="mt-3 text-sm leading-7 text-[var(--color-app-muted)]">
                                        {activeCut.method}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="discovery-splice__poster-frame relative mx-auto w-full max-w-[15rem] self-center lg:self-end">
                            <span
                                aria-hidden="true"
                                className="absolute -left-4 -top-4 font-mono text-[var(--font-size-caption)] uppercase tracking-[0.16em] text-[var(--color-projector)]"
                            >
                                Focus plane
                            </span>

                            {posterUrl ? (
                                <img
                                    alt={`${activeMovie.title} poster`}
                                    className="aspect-[2/3] w-full border border-[var(--color-line-strong)] object-cover shadow-[var(--shadow-app-elevated)]"
                                    decoding="async"
                                    height={750}
                                    key={`poster-${activeCut.id}-${activeMovie.id}`}
                                    loading="lazy"
                                    sizes="(min-width: 1024px) 15rem, 50vw"
                                    src={posterUrl}
                                    srcSet={posterSrcSet}
                                    width={500}
                                />
                            ) : (
                                <div className="grid aspect-[2/3] place-items-center border border-dashed border-[var(--color-line-strong)] text-center">
                                    <span className="archive-label px-6">
                                        Poster unavailable
                                    </span>
                                </div>
                            )}
                        </div>

                        <aside
                            aria-label="Titles in this editorial cut"
                            className="self-end"
                        >
                            <div className="mb-4 flex items-end justify-between gap-4">
                                <div>
                                    <p className="archive-label">Titles in this collection</p>

                                    <p className="mt-2 text-sm text-[var(--color-app-muted)]">
                                        {activeCut.movies.length} titles
                                    </p>
                                </div>

                                <span className="font-mono text-[var(--font-size-caption)] uppercase tracking-[0.16em] text-[var(--color-app-subtle)]">
                                    Not personalized
                                </span>
                            </div>

                            <ol className="border-b border-[var(--color-line-soft)]">
                                {activeCut.movies.map((movie, index) => {
                                    const isActive = index === safeMovieIndex

                                    return (
                                        <li
                                            className="border-t border-[var(--color-line-soft)]"
                                            key={movie.id}
                                        >
                                            <button
                                                aria-pressed={isActive}
                                                className={`group grid min-h-24 w-full grid-cols-[2.25rem_1fr_auto] items-center gap-3 py-4 text-left transition-colors ${isActive
                                                        ? 'text-[var(--color-app-text)]'
                                                        : 'text-[var(--color-app-muted)] hover:text-[var(--color-app-text)]'
                                                    }`}
                                                onClick={() => {
                                                    setActiveMovieIndex(index)
                                                }}
                                                type="button"
                                            >
                                                <span className="font-mono text-[var(--font-size-caption)] tracking-[0.16em] text-[var(--color-app-subtle)]">
                                                    {String(index + 1).padStart(2, '0')}
                                                </span>

                                                <span>
                                                    <span className="block text-sm font-semibold leading-5">
                                                        {movie.title}
                                                    </span>

                                                    <span className="mt-1 block text-xs uppercase tracking-[0.12em] text-[var(--color-app-subtle)]">
                                                        {getReleaseYear(movie.release_date)}
                                                        {' / '}
                                                        {movie.original_language}
                                                    </span>
                                                </span>

                                                <span
                                                    aria-hidden="true"
                                                    className={`h-px transition-[width,background-color] ${isActive
                                                            ? 'w-10 bg-[var(--color-projector)]'
                                                            : 'w-4 bg-[var(--color-line)] group-hover:w-7'
                                                        }`}
                                                />
                                            </button>
                                        </li>
                                    )
                                })}
                            </ol>
                        </aside>
                    </div>
                </div>
            </>
        )
    }

    return (
        <section
            aria-labelledby="discovery-splice-title"
            className="discovery-splice -mx-[var(--layout-gutter)] mt-16 scroll-mt-24 border-t border-[var(--color-line-soft)] px-[var(--layout-gutter)] py-20 sm:mt-24 sm:py-24 lg:py-32"
            id="discovery-splice"
        >
            <div className="mx-auto max-w-[var(--layout-max)]">
                <header className="grid gap-8 pb-12 lg:grid-cols-[auto_minmax(0,1fr)_minmax(18rem,0.55fr)] lg:items-end lg:gap-12 lg:pb-16">
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-projector)]">
                        02 / Discovery Splice
                    </p>

                    <div>
                        <h2
                            className="font-display text-balance text-[clamp(3.25rem,6.8vw,7.5rem)] leading-[0.88] text-[var(--color-app-text)]"
                            id="discovery-splice-title"
                        >
                            Discovery with a human pulse.
                        </h2>
                    </div>

                    <div className="border-l border-[var(--color-line-soft)] pl-6">
                        <p className="text-pretty text-sm leading-7 text-[var(--color-app-muted)]">
                            Each collection uses visible TMDB filters. These lists
                            are not personalized.
                        </p>
                    </div>
                </header>

                {sceneContent}
            </div>
        </section>
    )
}
