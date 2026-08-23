import { Library, UserRound } from 'lucide-react'
import { NavLink } from 'react-router'

import { CineScopeWordmark } from '../branding/CineScopeWordmark'
import { desktopNavigation } from '../../config/navigation'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { HeaderSearch } from '../../features/search/components/HeaderSearch'

function getNavigationClass(isActive: boolean): string {
  const baseClasses =
    'group relative flex h-full items-center gap-2 px-2.5 text-sm font-semibold tracking-[-0.02em] transition-colors duration-[var(--duration-micro)] lg:px-4 lg:text-[1.05rem]'

  const stateClasses = isActive
    ? 'text-[var(--color-paper-100)]'
    : 'text-[var(--color-paper-500)] hover:text-[var(--color-paper-100)]'

  return `${baseClasses} ${stateClasses}`
}

function getActionClass(isActive: boolean): string {
  const baseClasses =
    'group relative inline-flex h-full items-center gap-2.5 px-2 text-sm font-semibold transition-colors duration-[var(--duration-micro)] lg:px-3.5 lg:text-[1.05rem]'

  const stateClasses = isActive
    ? 'text-[var(--color-projector)]'
    : 'text-[var(--color-paper-500)] hover:text-[var(--color-paper-100)]'

  return `${baseClasses} ${stateClasses}`
}

export function DesktopHeader() {
  const { status, user } = useAuth()
  const isAuthenticated = status === 'authenticated'
  const accountTarget = isAuthenticated
    ? '/profile'
    : '/login'
  const accountLabel = isAuthenticated
    ? user?.displayName?.split(/\s+/)[0] || 'Profile'
    : status === 'initializing'
      ? 'Account'
      : 'Sign in'

  return (
    <header className="desktop-header sticky top-0 z-[var(--z-header)] hidden border-b border-[var(--color-line-soft)] backdrop-blur-xl md:block">
      <div className="mx-auto grid h-[var(--layout-header-height)] max-w-[108rem] grid-cols-[auto_1fr_auto] items-stretch gap-4 px-[var(--layout-gutter)] lg:gap-10">
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
          <ul className="flex h-full items-stretch">
            {desktopNavigation.map((item) =>
              item.to === '/search' ? (
                <HeaderSearch key={item.to} />
              ) : (
                <li className="h-full" key={item.to}>
                  <NavLink
                    className={({ isActive }) =>
                      getNavigationClass(isActive)
                    }
                    to={item.to}
                  >
                    {({ isActive }) => (
                      <>
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
              ),
            )}
          </ul>
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
            to={accountTarget}
          >
            {({ isActive }) => (
              <>
                <UserRound aria-hidden="true" className="size-4" />
                <span className="max-w-24 truncate">
                  {accountLabel}
                </span>

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
