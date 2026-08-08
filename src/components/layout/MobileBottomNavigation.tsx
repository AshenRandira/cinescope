import { NavLink } from 'react-router'

import { mobileNavigation } from '../../config/navigation'
import { useAuth } from '../../features/auth/hooks/useAuth'

function getMobileLinkClass(isActive: boolean): string {
  const baseClasses =
    'group relative flex min-h-16 flex-col items-center justify-center gap-1.5 px-1 pb-1 pt-2 text-[0.68rem] font-semibold transition-colors duration-[var(--duration-micro)]'

  const stateClasses = isActive
    ? 'text-[var(--color-projector)]'
    : 'text-[var(--color-paper-500)] active:text-[var(--color-paper-100)]'

  return `${baseClasses} ${stateClasses}`
}

export function MobileBottomNavigation() {
  const { status } = useAuth()
  const isAuthenticated = status === 'authenticated'

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-[var(--z-navigation)] border-t border-[var(--color-line)] bg-[color:rgb(7_8_6/0.92)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <div className="grid grid-cols-5">
        {mobileNavigation.map((item) => {
          const Icon = item.icon
          const isAccountItem = item.to === '/profile'
          const target =
            isAccountItem && !isAuthenticated
              ? '/login'
              : item.to
          const label =
            isAccountItem && !isAuthenticated
              ? 'Sign in'
              : item.label

          return (
            <NavLink
              className={({ isActive }) =>
                getMobileLinkClass(isActive)
              }
              end={item.end}
              key={item.to}
              to={target}
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-[30%] top-0 h-px bg-[var(--color-projector)] transition-transform duration-[var(--duration-interface)] ${
                      isActive ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />

                  <span className="relative">
                    <Icon
                      aria-hidden="true"
                      className="size-[1.15rem] transition-transform duration-[var(--duration-interface)] ease-[var(--ease-focus)] group-active:scale-90"
                    />

                    {isActive ? (
                      <span
                        aria-hidden="true"
                        className="absolute -right-1.5 -top-1 size-1 bg-[var(--color-projector)]"
                      />
                    ) : null}
                  </span>

                  <span>{label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
