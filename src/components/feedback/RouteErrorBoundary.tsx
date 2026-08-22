import { Home, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'
import {
  isRouteErrorResponse,
  Link,
  useRouteError,
} from 'react-router'

import { CineScopeWordmark } from '../branding/CineScopeWordmark'

type RouteErrorCopy = {
  description: string
  eyebrow: string
  title: string
}

function getRouteErrorCopy(error: unknown): RouteErrorCopy {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return {
      description:
        'The requested page may have moved, or the address may no longer be available.',
      eyebrow: '404 / Page missing',
      title: 'This page left the archive.',
    }
  }

  return {
    description:
      'CineScope could not finish loading this view. Your saved library remains safe in this browser.',
    eyebrow: 'Page error',
    title: 'This page stopped loading.',
  }
}

export function RouteErrorBoundary() {
  const error = useRouteError()
  const copy = getRouteErrorCopy(error)

  useEffect(() => {
    document.title = 'Page error — CineScope'
  }, [])

  return (
    <div className="projection-surface min-h-screen px-[var(--layout-gutter)] py-8 md:py-12">
      <div className="mx-auto max-w-[var(--layout-max)]">
        <Link
          aria-label="CineScope home"
          className="inline-flex"
          to="/"
        >
          <CineScopeWordmark showDescriptor />
        </Link>

        <main
          className="grid min-h-[calc(100svh-10rem)] place-items-center py-16"
          id="main-content"
        >
          <section
            aria-labelledby="route-error-title"
            className="w-full max-w-3xl border border-[var(--color-line)] bg-[color:rgb(10_12_10/0.8)] p-7 shadow-[var(--shadow-elevated)] sm:p-10 md:p-14"
          >
            <p className="archive-label text-[var(--color-projector)]">
              {copy.eyebrow}
            </p>

            <h1
              className="mt-5 max-w-2xl font-display text-5xl leading-[0.92] tracking-[var(--tracking-display)] text-[var(--color-paper-100)] sm:text-6xl md:text-7xl"
              id="route-error-title"
            >
              {copy.title}
            </h1>

            <p className="mt-6 max-w-xl text-[var(--font-size-small)] leading-7 text-[var(--color-paper-400)]">
              {copy.description}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 bg-[var(--color-projector)] px-6 text-sm font-bold text-[var(--color-ink-950)] transition-colors hover:bg-[var(--color-projector-strong)]"
                onClick={() => window.location.reload()}
                type="button"
              >
                <RefreshCw aria-hidden="true" className="size-4" />
                Reload this view
              </button>

              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 border border-[var(--color-line-strong)] px-6 text-sm font-bold text-[var(--color-paper-100)] transition-colors hover:border-[var(--color-projector)] hover:text-[var(--color-projector)]"
                to="/"
              >
                <Home aria-hidden="true" className="size-4" />
                Return home
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
