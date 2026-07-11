import { NavLink } from 'react-router'
import { mobileNavigation } from '../../config/navigation'

function getMobileLinkClass(isActive: boolean): string {
  const baseClasses =
    'flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl px-1 text-xs font-medium transition-colors'

  const stateClasses = isActive
    ? 'bg-[var(--color-app-primary-soft)] text-[var(--color-app-primary)]'
    : 'text-[var(--color-app-muted)] active:bg-white/5'

  return `${baseClasses} ${stateClasses}`
}

export function MobileBottomNavigation() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[rgba(5,7,13,0.94)] px-2 pt-2 backdrop-blur-xl md:hidden"
      style={{
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
      }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        {mobileNavigation.map((item) => {
          const Icon = item.icon

          return (
            <li key={item.to}>
              <NavLink
                className={({ isActive }) =>
                  getMobileLinkClass(isActive)
                }
                end={item.end}
                to={item.to}
              >
                <Icon aria-hidden="true" size={21} strokeWidth={2} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
