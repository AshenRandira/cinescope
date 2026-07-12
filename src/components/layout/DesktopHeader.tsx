import { Library, UserRound } from 'lucide-react'
import { NavLink } from 'react-router'

import { CineScopeWordmark } from '../branding/CineScopeWordmark'
import { desktopNavigation } from '../../config/navigation'

function getNavigationClass(isActive: boolean): string {
  const baseClasses =
    'group relative flex h-full items-center gap-2 px-4 text-sm font-semibold tracking-[-0.02em] transition-colors duration-[var(--duration-micro)]'

  const stateClasses = isActive
    ? 'text-[var(--color-paper-100)]'
    : 'text-[var(--color-paper-500)] hover:text-[var(--color-paper-100)]'

  return `${baseClasses} ${stateClasses}`
}

function getActionClass(isActive: boolean): string {
  const baseClasses =
    'group relative inline-flex h-full items-center gap-2 px-3 text-sm font-semibold transition-colors duration-[var(--duration-micro)]'

  const stateClasses = isActive
    ? 'text-[var(--color-projector)]'
    : 'text-[var(--color-paper-500)] hover:text-[var(--color-paper-100)]'

  return `${baseClasses} ${stateClasses}`
}

export function DesktopHeader() {
  return (
    <header className="sticky top-0 z-[var(--z-header)] hidden border-b border-[var(--color-line-soft)] bg-[color:rgb(7_8_6/0.86)] backdrop-blur-xl md:block">
      <div className="mx-auto grid h-[var(--layout-header-height)] max-w-[var(--layout-max)] grid-cols-[auto_1fr_auto] items-stretch gap-8 px-[var(--layout-gutter)]">
        <NavLink
          aria-label="CineScope home"
          className="flex items-center"
          to="/"
        >
          <CineScopeWordmark showDescriptor />
        </NavLink>

        <nav
          aria-label="Primary navigation"
          className="flex min-w-0 justify-center"
        >
          <ol className="flex h-full items-stretch">
            {desktopNavigation.map((item, index) => (
              <li className="h-full" key={item.to}>
                <NavLink
                  className={({ isActive }) =>
                    getNavigationClass(isActive)
                  }
                  to={item.to}
                >
                  {({ isActive }) => (
                    <>
                      <span className="font-mono text-[0.56rem] tracking-[0.12em] text-[var(--color-paper-600)] transition-colors group-hover:text-[var(--color-projector)]">
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <span>{item.label}</span>

                      <span
                        aria-hidden="true"
                        className={`absolute inset-x-4 bottom-0 h-px origin-left bg-[var(--color-projector)] transition-transform duration-[var(--duration-interface)] ease-[var(--ease-enter)] ${
                          isActive
                            ? 'scale-x-100'
                            : 'scale-x-0 group-hover:scale-x-100'
                        }`}
                      />
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex h-full items-stretch">
          <NavLink
            className={({ isActive }) =>
              getActionClass(isActive)
            }
            to="/library"
          >
            {({ isActive }) => (
              <>
                <Library aria-hidden="true" className="size-4" />
                <span>Library</span>

                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3 bottom-0 h-px bg-[var(--color-projector)] transition-transform ${
                    isActive ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </>
            )}
          </NavLink>

          <NavLink
            className={({ isActive }) =>
              getActionClass(isActive)
            }
            to="/profile"
          >
            {({ isActive }) => (
              <>
                <UserRound aria-hidden="true" className="size-4" />
                <span>Profile</span>

                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3 bottom-0 h-px bg-[var(--color-projector)] transition-transform ${
                    isActive ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </>
            )}
          </NavLink>
        </div>
      </div>
    </header>
  )
}