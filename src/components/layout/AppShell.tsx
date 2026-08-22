import { useEffect, useRef } from 'react'
import {
  Link,
  Outlet,
  useLocation,
  useNavigation,
} from 'react-router'

import { DocumentMetadata } from '../metadata/DocumentMetadata'
import { DesktopHeader } from './DesktopHeader'
import { MobileBottomNavigation } from './MobileBottomNavigation'

export function AppShell() {
  const { pathname } = useLocation()
  const navigation = useNavigation()
  const mainRef = useRef<HTMLElement>(null)
  const previousPathnameRef = useRef(pathname)
  const isNavigating = navigation.state !== 'idle'

  useEffect(() => {
    if (previousPathnameRef.current === pathname) {
      return
    }

    previousPathnameRef.current = pathname
    mainRef.current?.focus()
  }, [pathname])

  return (
    <div className="projection-surface min-h-screen">
      <DocumentMetadata />

      <div
        aria-hidden="true"
        className="route-progress"
        data-active={isNavigating}
      />

      <p
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {isNavigating ? 'Loading the next archive view.' : ''}
      </p>

      <a
        className="fixed left-4 top-4 z-[var(--z-skip-link)] -translate-y-24 border border-black bg-[var(--color-paper-100)] px-4 py-3 font-semibold text-[var(--color-ink-950)] transition-transform focus:translate-y-0"
        href="#main-content"
      >
        Skip to main content
      </a>

      <DesktopHeader />

      <main
        className="w-full px-[var(--layout-gutter)] pb-[calc(var(--layout-mobile-nav-height)+env(safe-area-inset-bottom)+2rem)] pt-8 focus:outline-none md:min-h-[calc(100svh-var(--layout-header-height))] md:pb-0 md:pt-10"
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
      >
        <Outlet />
      </main>

      <footer className="border-t border-[var(--color-line-soft)] pb-[calc(var(--layout-mobile-nav-height)+env(safe-area-inset-bottom)+1.5rem)] md:pb-0">
        <div className="mx-auto grid min-h-32 max-w-[var(--layout-max)] gap-6 px-[var(--layout-gutter)] py-8 text-[var(--color-paper-500)] md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="font-mono text-[var(--font-size-caption)] uppercase tracking-[0.16em] text-[var(--color-paper-300)]">
              CineScope / The Living Archive
            </p>
            <p className="mt-2 max-w-2xl text-[var(--font-size-caption)] leading-6">
              This product uses the TMDB API but is not endorsed or
              certified by TMDB.
            </p>
          </div>

          <div className="flex flex-col gap-4 md:items-end">
            <nav
              aria-label="Credits and policies"
              className="flex flex-wrap gap-x-5 gap-y-1"
            >
              <Link
                className="inline-flex min-h-11 items-center hover:text-[var(--color-projector)]"
                to="/credits"
              >
                Credits
              </Link>
              <Link
                className="inline-flex min-h-11 items-center hover:text-[var(--color-projector)]"
                to="/privacy"
              >
                Privacy
              </Link>
              <Link
                className="inline-flex min-h-11 items-center hover:text-[var(--color-projector)]"
                to="/terms"
              >
                Terms
              </Link>
              <Link
                className="inline-flex min-h-11 items-center hover:text-[var(--color-projector)]"
                to="/accessibility"
              >
                Accessibility
              </Link>
            </nav>

            <p className="font-mono text-[var(--font-size-caption)] uppercase tracking-[0.14em]">
              {'\u00A9'} {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>

      <MobileBottomNavigation />
    </div>
  )
}
