import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { CineScopeWordmark } from '../../../components/branding/CineScopeWordmark'

import './AuthPages.css'

type AuthPageFrameProps = {
  children: ReactNode
  description: string
  eyebrow: string
  title: string
}

export function AuthPageFrame({
  children,
  description,
  eyebrow,
  title,
}: AuthPageFrameProps) {
  return (
    <section className="auth-page">
      <div
        aria-hidden="true"
        className="auth-page__atmosphere"
      />

      <div className="auth-page__layout">
        <header className="auth-page__opening">
          <Link
            aria-label="CineScope home"
            className="auth-page__wordmark"
            to="/"
          >
            <CineScopeWordmark showDescriptor />
          </Link>

          <div className="auth-page__title-block">
            <p className="archive-label">
              {eyebrow}
            </p>
            <h1 className="auth-page__title font-display text-balance">
              {title}
            </h1>
            <p className="auth-page__description text-pretty">
              {description}
            </p>
          </div>

        </header>

        <div className="auth-page__panel">
          {children}
        </div>
      </div>
    </section>
  )
}
