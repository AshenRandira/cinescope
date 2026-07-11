import { Outlet } from 'react-router'
import { DesktopHeader } from './DesktopHeader'
import { MobileBottomNavigation } from './MobileBottomNavigation'

export function AppShell() {
  return (
    <div className="min-h-screen">
      <a
        className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-white px-4 py-3 font-semibold text-black focus:not-sr-only"
        href="#main-content"
      >
        Skip to main content
      </a>

      <DesktopHeader />

      <main
        className="mx-auto w-full max-w-7xl px-4 pb-28 pt-8 sm:px-6 md:pb-12 md:pt-10 lg:px-8"
        id="main-content"
        tabIndex={-1}
      >
        <Outlet />
      </main>

      <footer className="hidden border-t border-white/10 md:block">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-6 text-sm text-[var(--color-app-subtle)] lg:px-8">
          <p>Discover stories worth watching.</p>
          <p>{'\u00A9'} {new Date().getFullYear()} CineScope</p>
        </div>
      </footer>

      <MobileBottomNavigation />
    </div>
  )
}

