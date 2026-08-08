import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link, useNavigate } from 'react-router'

import {
  AUTH_DISPLAY_NAME_MAX_LENGTH,
  getAuthErrorMessage,
} from '../../auth/data/auth'
import { useAuth } from '../../auth/hooks/useAuth'
import { useLibrary } from '../../library/hooks/useLibrary'

import './ProfilePage.css'

function formatAccountDate(
  value: string | null,
): string {
  if (!value) {
    return 'Not recorded'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getInitials(
  displayName: string | null,
  email: string | null,
): string {
  const source = displayName || email || 'CineScope member'
  const initials = source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return initials || 'CS'
}

export function ProfilePage() {
  const navigate = useNavigate()
  const {
    logout,
    updateDisplayName,
    user,
  } = useAuth()
  const { records } = useLibrary()
  const [displayName, setDisplayName] = useState(
    user?.displayName ?? '',
  )
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null)
  const [successMessage, setSuccessMessage] = useState<
    string | null
  >(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSigningOut, setIsSigningOut] =
    useState(false)

  useEffect(() => {
    document.title = 'Your Profile — CineScope'
  }, [])

  const libraryStats = useMemo(
    () => ({
      favourites: records.filter(
        (record) => record.isFavorite,
      ).length,
      rated: records.filter(
        (record) => record.userRating !== null,
      ).length,
      saved: records.length,
      watched: records.filter(
        (record) => record.isWatched,
      ).length,
    }),
    [records],
  )

  if (!user) {
    return null
  }

  async function handleProfileSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    const normalizedName = displayName.trim()

    if (normalizedName.length < 2) {
      setErrorMessage(
        'Enter at least two characters for your display name.',
      )
      return
    }

    setIsSaving(true)

    try {
      await updateDisplayName(normalizedName)
      setDisplayName(normalizedName)
      setSuccessMessage('Your display name was updated.')
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleLogout(): Promise<void> {
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSigningOut(true)

    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error))
      setIsSigningOut(false)
    }
  }

  return (
    <section className="profile-page">
      <header className="profile-opening">
        <div className="profile-opening__identity">
          <div
            aria-hidden="true"
            className="profile-opening__monogram font-display"
          >
            {getInitials(user.displayName, user.email)}
          </div>

          <div>
            <p className="archive-label">
              01 / Member profile
            </p>
            <h1 className="profile-opening__title font-display text-balance">
              {user.displayName || 'CineScope member'}
            </h1>
            <p className="profile-opening__email">
              {user.email || 'Email unavailable'}
            </p>
          </div>
        </div>

        <div className="profile-opening__session">
          <span
            aria-hidden="true"
            className="profile-opening__signal"
          />
          <div>
            <p>Firebase session active</p>
            <span>
              {user.emailVerified
                ? 'Email verified'
                : 'Email not yet verified'}
            </span>
          </div>
        </div>
      </header>

      <section
        className="profile-library"
        aria-labelledby="profile-library-heading"
      >
        <header className="profile-section-heading">
          <div>
            <p className="archive-label">
              02 / Local archive
            </p>
            <h2
              className="font-display"
              id="profile-library-heading"
            >
              Your collection at a glance.
            </h2>
          </div>
          <p>
            These records are still stored only in this
            browser. Account-backed database synchronisation
            belongs to the next persistence phase.
          </p>
        </header>

        <dl className="profile-library__stats">
          <div>
            <dt>Saved</dt>
            <dd>{libraryStats.saved}</dd>
          </div>
          <div>
            <dt>Watched</dt>
            <dd>{libraryStats.watched}</dd>
          </div>
          <div>
            <dt>Favourites</dt>
            <dd>{libraryStats.favourites}</dd>
          </div>
          <div>
            <dt>Rated</dt>
            <dd>{libraryStats.rated}</dd>
          </div>
        </dl>

        <Link className="profile-library__link" to="/library">
          Open the full library
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section
        className="profile-account"
        aria-labelledby="profile-account-heading"
      >
        <header className="profile-section-heading">
          <div>
            <p className="archive-label">
              03 / Account register
            </p>
            <h2
              className="font-display"
              id="profile-account-heading"
            >
              Maintain your identity.
            </h2>
          </div>
          <p>
            Profile identity is managed by Firebase
            Authentication. CineScope does not persist your
            password.
          </p>
        </header>

        <div className="profile-account__layout">
          <form
            className="profile-account__form"
            onSubmit={handleProfileSubmit}
          >
            <label>
              <span>Display name</span>
              <input
                autoComplete="name"
                disabled={isSaving}
                maxLength={AUTH_DISPLAY_NAME_MAX_LENGTH}
                onChange={(event) =>
                  setDisplayName(event.target.value)
                }
                required
                value={displayName}
              />
            </label>

            {errorMessage ? (
              <p
                className="profile-account__message profile-account__message--error"
                role="alert"
              >
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p
                aria-live="polite"
                className="profile-account__message profile-account__message--success"
              >
                {successMessage}
              </p>
            ) : null}

            <button disabled={isSaving} type="submit">
              {isSaving
                ? 'Saving profile…'
                : 'Save display name'}
            </button>
          </form>

          <aside className="profile-account__metadata">
            <dl>
              <div>
                <dt>Member since</dt>
                <dd>{formatAccountDate(user.createdAt)}</dd>
              </div>
              <div>
                <dt>Last sign in</dt>
                <dd>
                  {formatAccountDate(user.lastSignInAt)}
                </dd>
              </div>
              <div>
                <dt>Account reference</dt>
                <dd>{user.uid.slice(0, 10)}…</dd>
              </div>
            </dl>

            <button
              className="profile-account__logout"
              disabled={isSigningOut}
              onClick={() => void handleLogout()}
              type="button"
            >
              {isSigningOut
                ? 'Closing session…'
                : 'Sign out of CineScope'}
            </button>
          </aside>
        </div>
      </section>
    </section>
  )
}
