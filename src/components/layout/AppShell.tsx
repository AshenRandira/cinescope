import { useEffect, useRef } from 'react'
import {
  Outlet,
  useLocation,
  useNavigation,
} from 'react-router'

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

      <footer className="hidden border-t border-[var(--color-line-soft)] md:block">
        <div className="mx-auto flex min-h-20 max-w-[var(--layout-max)] items-center justify-between gap-8 px-[var(--layout-gutter)] text-[var(--color-paper-600)]">
          <p className="font-mono text-[var(--font-size-caption)] uppercase tracking-[0.16em]">
            CineScope / The Living Archive
          </p>

          <p className="font-mono text-[var(--font-size-caption)] uppercase tracking-[0.14em]">
            {'\u00A9'} {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      <MobileBottomNavigation />
    </div>
  )
}
