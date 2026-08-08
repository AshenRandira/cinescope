import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'

import './HomepageClosingFrame.css'

const closingRoutes = [
  {
    description:
      'Move deeper into cinema through the developing CineScope movie archive.',
    index: '01',
    label: 'Enter the movie archive',
    to: '/movies',
  },
  {
    description:
      'Follow episodic stories through the dedicated television index.',
    index: '02',
    label: 'Tune into television',
    to: '/tv',
  },
  {
    description:
      'Search the wider CineScope index by title, person, or series.',
    index: '03',
    label: 'Search the archive',
    to: '/search',
  },
] as const

export function HomepageClosingFrame() {
  return (
    <section
      aria-labelledby="homepage-closing-frame-title"
      className="homepage-closing-frame -mx-[var(--layout-gutter)] scroll-mt-24 border-t border-[var(--color-line-soft)] px-[var(--layout-gutter)] pb-16 pt-24 sm:pb-20 sm:pt-28 lg:pb-24 lg:pt-36"
      id="homepage-closing-frame"
    >
      <div className="mx-auto max-w-[var(--layout-max)]">
        <header className="mx-auto max-w-6xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-projector)]">
            05 / Closing Frame
          </p>

          <h2
            className="font-display text-balance mt-8 text-[clamp(3.75rem,8.5vw,9.75rem)] leading-[0.82] text-[var(--color-app-text)]"
            id="homepage-closing-frame-title"
          >
            Every ending opens another reel.
          </h2>

          <p className="text-pretty mx-auto mt-8 max-w-2xl text-base leading-8 text-[var(--color-app-muted)] sm:text-lg">
            The homepage sequence ends here, but the archive
            continues through cinema, television, and the wider
            CineScope index.
          </p>
        </header>

        <div className="mt-20 grid gap-14 lg:mt-28 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.55fr)] lg:items-start lg:gap-20">
          <nav aria-label="Continue exploring CineScope">
            <p className="archive-label mb-5">
              Continue through the archive
            </p>

            <ol>
              {closingRoutes.map((route) => (
                <li key={route.to}>
                  <Link
                    className="homepage-closing-frame__route group"
                    to={route.to}
                  >
                    <span className="font-mono text-[var(--font-size-caption)] tracking-[0.16em] text-[var(--color-app-subtle)]">
                      {route.index}
                    </span>

                    <span>
                      <span className="block text-base font-semibold text-[var(--color-app-text)] sm:text-lg">
                        {route.label}
                      </span>

                      <span className="mt-2 block max-w-xl text-sm leading-6 text-[var(--color-app-muted)]">
                        {route.description}
                      </span>
                    </span>

                    <ArrowUpRight
                      aria-hidden="true"
                      className="homepage-closing-frame__route-arrow size-5 text-[var(--color-app-subtle)]"
                    />
                  </Link>
                </li>
              ))}
            </ol>
          </nav>

          <aside
            aria-labelledby="homepage-credits-title"
            className="homepage-closing-frame__credits border border-[var(--color-line-soft)] px-6 py-8 sm:px-8 sm:py-10"
            id="credits"
          >
            <p className="archive-label">
              Credits / Data source
            </p>

            <h3
              className="font-display mt-5 text-4xl leading-none text-[var(--color-app-text)] sm:text-5xl"
              id="homepage-credits-title"
            >
              Built with the archive in view.
            </h3>

            <p className="mt-6 text-sm leading-7 text-[var(--color-app-muted)]">
              CineScope uses movie, television, person, rating,
              release, and artwork information supplied through
              The Movie Database API.
            </p>

            <a
              aria-label="Visit The Movie Database"
              className="mt-9 inline-block"
              href="https://www.themoviedb.org"
              rel="noreferrer"
              target="_blank"
            >
              <img
                alt="The Movie Database (TMDB)"
                className="w-40 max-w-full sm:w-44"
                decoding="async"
                loading="lazy"
                src="/branding/tmdb-logo.svg"
              />
            </a>

            <p className="mt-8 border-t border-[var(--color-line-soft)] pt-6 text-xs leading-6 text-[var(--color-app-subtle)]">
              This product uses the TMDB API but is not endorsed
              or certified by TMDB.
            </p>

            <p className="mt-4 text-xs leading-6 text-[var(--color-app-subtle)]">
              Availability, release information, rankings, and
              popularity signals can change over time and may
              vary by territory.
            </p>
          </aside>
        </div>

        <div className="mt-24 text-center sm:mt-28">
          <span
            aria-hidden="true"
            className="homepage-closing-frame__end-rule mx-auto block h-px w-full max-w-3xl"
          />

          <p className="mt-7 font-mono text-[var(--font-size-caption)] uppercase tracking-[0.2em] text-[var(--color-app-subtle)]">
            End of homepage sequence / The archive remains open
          </p>
        </div>
      </div>
    </section>
  )
}