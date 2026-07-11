import { Film, Library, UserRound } from 'lucide-react'
import { NavLink } from 'react-router'
import { desktopNavigation } from '../../config/navigation'

function getNavigationClass(isActive: boolean): string {
  const baseClasses =
    'rounded-full px-4 py-2 text-sm font-medium transition-colors'

  const stateClasses = isActive
    ? 'bg-white/10 text-white'
    : 'text-[var(--color-app-muted)] hover:bg-white/5 hover:text-white'

  return `${baseClasses} ${stateClasses}`
}

function getActionClass(isActive: boolean): string {
  const baseClasses =
    'inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors'

  const stateClasses = isActive
    ? 'bg-[var(--color-app-primary-soft)] text-[var(--color-app-primary)]'
    : 'text-[var(--color-app-muted)] hover:bg-white/5 hover:text-white'

  return `${baseClasses} ${stateClasses}`
}

export function DesktopHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[rgba(5,7,13,0.88)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-[4.5rem] w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <NavLink
          aria-label="CineScope home"
          className="flex shrink-0 items-center gap-3 rounded-lg"
          end
          to="/"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--color-app-primary)] text-white shadow-lg shadow-violet-950/40">
            <Film aria-hidden="true" size={21} strokeWidth={2.2} />
          </span>

          <span className="text-lg font-bold tracking-tight sm:text-xl">
            Cine
            <span className="text-[var(--color-app-primary)]">Scope</span>
          </span>
        </NavLink>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-1 md:flex"
        >
          {desktopNavigation.map((item) => (
            <NavLink
              className={({ isActive }) => getNavigationClass(isActive)}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <NavLink
            aria-label="My Library"
            className={({ isActive }) => getActionClass(isActive)}
            to="/library"
          >
            <Library aria-hidden="true" size={19} />
            <span className="hidden lg:inline">My Library</span>
          </NavLink>

          <NavLink
            aria-label="Profile"
            className={({ isActive }) => getActionClass(isActive)}
            to="/profile"
          >
            <UserRound aria-hidden="true" size={19} />
            <span className="hidden lg:inline">Profile</span>
          </NavLink>
        </div>
      </div>
    </header>
  )
}
