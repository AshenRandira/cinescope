import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link, useNavigate } from 'react-router'

import {
  AUTH_DISPLAY_NAME_MAX_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  getAuthErrorMessage,
  storeAccountDeletionNotice,
} from '../../auth/data/auth'
import { useAuth } from '../../auth/hooks/useAuth'
import { getLibrarySyncCopy } from '../../library/data/library'
import { useLibrary } from '../../library/hooks/useLibrary'
import { PreferencesEditor } from '../../preferences/components/PreferencesEditor'
import { usePreferences } from '../../preferences/hooks/usePreferences'
import { useRecommendationFeedback } from '../../recommendations/hooks/useRecommendationFeedback'
import {
  buildAccountExport,
  downloadAccountExport,
} from '../data/accountExport'

import './ProfilePage.css'

const ACCOUNT_DELETE_CONFIRMATION = 'DELETE MY ACCOUNT'

type ActionMessage = {
  kind: 'error' | 'success'
  text: string
}

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

function ProfileMessage({
  message,
}: {
  message: ActionMessage | null
}) {
  if (!message) return null

  return (
    <p
      aria-live={
        message.kind === 'success' ? 'polite' : undefined
      }
      className={`profile-account__message profile-account__message--${message.kind}`}
      role={message.kind === 'error' ? 'alert' : undefined}
    >
      {message.text}
    </p>
  )
}

export function ProfilePage() {
  const navigate = useNavigate()
  const {
    changePassword,
    deleteAccount,
    logout,
    refreshUser,
    sendVerificationEmail,
    updateDisplayName,
    user,
  } = useAuth()
  const {
    clearAccountData: clearLibraryData,
    records,
    retrySync,
    syncError,
    syncStatus,
  } = useLibrary()
  const {
    clearAccountData: clearPreferenceData,
    preferences,
  } = usePreferences()
  const {
    clearAccountData: clearRecommendationFeedback,
    feedback: recommendationFeedback,
  } = useRecommendationFeedback()
  const syncCopy = getLibrarySyncCopy(
    syncStatus,
    syncError,
  )
  const [displayName, setDisplayName] = useState(
    user?.displayName ?? '',
  )
  const [profileMessage, setProfileMessage] =
    useState<ActionMessage | null>(null)
  const [verificationMessage, setVerificationMessage] =
    useState<ActionMessage | null>(null)
  const [passwordMessage, setPasswordMessage] =
    useState<ActionMessage | null>(null)
  const [exportMessage, setExportMessage] =
    useState<ActionMessage | null>(null)
  const [deletionMessage, setDeletionMessage] =
    useState<ActionMessage | null>(null)
  const [currentPassword, setCurrentPassword] =
    useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] =
    useState('')
  const [deletePassword, setDeletePassword] =
    useState('')
  const [deleteConfirmation, setDeleteConfirmation] =
    useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSigningOut, setIsSigningOut] =
    useState(false)
  const [isVerifying, setIsVerifying] =
    useState(false)
  const [isRefreshing, setIsRefreshing] =
    useState(false)
  const [isChangingPassword, setIsChangingPassword] =
    useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const accountUser = user

  async function handleProfileSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()
    setProfileMessage(null)

    const normalizedName = displayName.trim()

    if (normalizedName.length < 2) {
      setProfileMessage({
        kind: 'error',
        text: 'Enter at least two characters for your display name.',
      })
      return
    }

    setIsSaving(true)

    try {
      await updateDisplayName(normalizedName)
      setDisplayName(normalizedName)
      setProfileMessage({
        kind: 'success',
        text: 'Your display name was updated.',
      })
    } catch (error) {
      setProfileMessage({
        kind: 'error',
        text: getAuthErrorMessage(error),
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleVerificationEmail(): Promise<void> {
    setVerificationMessage(null)
    setIsVerifying(true)

    try {
      await sendVerificationEmail()
      setVerificationMessage({
        kind: 'success',
        text: `Verification email sent to ${accountUser.email ?? 'your address'}. Open the link, then refresh the status here.`,
      })
    } catch (error) {
      setVerificationMessage({
        kind: 'error',
        text: getAuthErrorMessage(error),
      })
    } finally {
      setIsVerifying(false)
    }
  }

  async function handleVerificationRefresh(): Promise<void> {
    setVerificationMessage(null)
    setIsRefreshing(true)

    try {
      await refreshUser()
      setVerificationMessage({
        kind: 'success',
        text: 'Email verification status refreshed.',
      })
    } catch (error) {
      setVerificationMessage({
        kind: 'error',
        text: getAuthErrorMessage(error),
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  async function handlePasswordSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()
    setPasswordMessage(null)

    if (!currentPassword) {
      setPasswordMessage({
        kind: 'error',
        text: 'Enter your current password to confirm this change.',
      })
      return
    }

    if (newPassword.length < AUTH_PASSWORD_MIN_LENGTH) {
      setPasswordMessage({
        kind: 'error',
        text: `Use at least ${AUTH_PASSWORD_MIN_LENGTH} characters for the new password.`,
      })
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        kind: 'error',
        text: 'The new passwords do not match.',
      })
      return
    }

    if (newPassword === currentPassword) {
      setPasswordMessage({
        kind: 'error',
        text: 'Choose a new password that differs from the current one.',
      })
      return
    }

    setIsChangingPassword(true)

    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage({
        kind: 'success',
        text: 'Your password was changed securely.',
      })
    } catch (error) {
      setPasswordMessage({
        kind: 'error',
        text: getAuthErrorMessage(error),
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  function handleExport(): void {
    setExportMessage(null)

    try {
      downloadAccountExport(
        buildAccountExport({
          preferences,
          recommendationFeedback,
          records,
          syncStatus,
          user: accountUser,
        }),
      )
      setExportMessage({
        kind: 'success',
        text: 'Your CineScope data was downloaded as a JSON file.',
      })
    } catch {
      setExportMessage({
        kind: 'error',
        text: 'The browser could not create the account export. Try again.',
      })
    }
  }

  async function handleDeleteSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()
    setDeletionMessage(null)

    if (!deletePassword) {
      setDeletionMessage({
        kind: 'error',
        text: 'Enter your current password before deleting the account.',
      })
      return
    }

    if (deleteConfirmation !== ACCOUNT_DELETE_CONFIRMATION) {
      setDeletionMessage({
        kind: 'error',
        text: `Type ${ACCOUNT_DELETE_CONFIRMATION} exactly to confirm permanent deletion.`,
      })
      return
    }

    setIsDeleting(true)

    try {
      await deleteAccount(deletePassword)
      clearLibraryData()
      clearPreferenceData()
      clearRecommendationFeedback()
      storeAccountDeletionNotice()
      await logout().catch(() => undefined)
      navigate('/login', { replace: true })
    } catch (error) {
      setDeletionMessage({
        kind: 'error',
        text: getAuthErrorMessage(error),
      })
      setIsDeleting(false)
    }
  }

  async function handleLogout(): Promise<void> {
    setProfileMessage(null)
    setIsSigningOut(true)

    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (error) {
      setProfileMessage({
        kind: 'error',
        text: getAuthErrorMessage(error),
      })
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
              Profile
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
            <p>Secure session active</p>
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
              Your library
            </p>
            <h2
              className="font-display"
              id="profile-library-heading"
            >
              Your collection at a glance.
            </h2>
          </div>
          <aside
            className={`profile-section-heading__note profile-section-heading__note--${syncStatus}`}
            role="status"
          >
            <p className="archive-label">
              {syncCopy.label}
            </p>
            <p>{syncCopy.detail}</p>
            {syncStatus === 'error' ? (
              <button onClick={retrySync} type="button">
                Retry cloud sync
              </button>
            ) : null}
          </aside>
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

      <PreferencesEditor />

      <section
        className="profile-account"
        aria-labelledby="profile-account-heading"
      >
        <header className="profile-section-heading">
          <div>
            <p className="archive-label">
              Account details
            </p>
            <h2
              className="font-display"
              id="profile-account-heading"
            >
              Manage your profile.
            </h2>
          </div>
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

            <ProfileMessage message={profileMessage} />

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
                ? 'Signing out…'
                : 'Sign out'}
            </button>
          </aside>
        </div>
      </section>

      <section
        className="profile-security"
        aria-labelledby="profile-security-heading"
      >
        <header className="profile-section-heading">
          <div>
            <p className="archive-label">
              Security and privacy
            </p>
            <h2
              className="font-display"
              id="profile-security-heading"
            >
              Control your account.
            </h2>
          </div>
          <aside className="profile-section-heading__note">
            <p className="archive-label">Security check</p>
            <p>
              Enter your current password before changing it or deleting your account.
            </p>
          </aside>
        </header>

        <div className="profile-security__grid">
          <article className="profile-security__card">
            <p className="archive-label">Email verification</p>
            <h3 className="font-display">
              {user.emailVerified
                ? 'Address verified.'
                : 'Verify your address.'}
            </h3>
            <p className="profile-security__description">
              {user.emailVerified
                ? 'Your email address has been verified.'
                : 'Send a verification email. Open its link, then refresh the status here.'}
            </p>

            {!user.emailVerified ? (
              <div className="profile-security__actions">
                <button
                  disabled={isVerifying || isRefreshing}
                  onClick={() =>
                    void handleVerificationEmail()
                  }
                  type="button"
                >
                  {isVerifying
                    ? 'Sending…'
                    : 'Send verification email'}
                </button>
                <button
                  className="profile-security__secondary"
                  disabled={isVerifying || isRefreshing}
                  onClick={() =>
                    void handleVerificationRefresh()
                  }
                  type="button"
                >
                  {isRefreshing
                    ? 'Refreshing…'
                    : 'Refresh verification status'}
                </button>
              </div>
            ) : (
              <p className="profile-security__status">
                Email address verified
              </p>
            )}

            <ProfileMessage message={verificationMessage} />
          </article>

          <article className="profile-security__card">
            <p className="archive-label">Personal data</p>
            <h3 className="font-display">
              Keep your own copy.
            </h3>
            <p className="profile-security__description">
              Download your profile, preferences, and library as JSON. Passwords and sign-in tokens are excluded.
            </p>
            <div className="profile-security__actions">
              <button onClick={handleExport} type="button">
                Download my CineScope data
              </button>
            </div>
            <ProfileMessage message={exportMessage} />
          </article>

          <article className="profile-security__card profile-security__card--wide">
            <div>
              <p className="archive-label">Password</p>
              <h3 className="font-display">
                Change your password.
              </h3>
              <p className="profile-security__description">
                Enter your current password, then choose a new one.
              </p>
            </div>

            <form
              className="profile-security__form"
              onSubmit={handlePasswordSubmit}
            >
              <label>
                <span>Current password</span>
                <input
                  autoComplete="current-password"
                  disabled={isChangingPassword}
                  onChange={(event) =>
                    setCurrentPassword(event.target.value)
                  }
                  required
                  type="password"
                  value={currentPassword}
                />
              </label>
              <label>
                <span>New password</span>
                <input
                  autoComplete="new-password"
                  disabled={isChangingPassword}
                  minLength={AUTH_PASSWORD_MIN_LENGTH}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  required
                  type="password"
                  value={newPassword}
                />
              </label>
              <label>
                <span>Confirm new password</span>
                <input
                  autoComplete="new-password"
                  disabled={isChangingPassword}
                  minLength={AUTH_PASSWORD_MIN_LENGTH}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  required
                  type="password"
                  value={confirmPassword}
                />
              </label>

              <ProfileMessage message={passwordMessage} />

              <button
                disabled={isChangingPassword}
                type="submit"
              >
                {isChangingPassword
                  ? 'Changing password…'
                  : 'Change password'}
              </button>
            </form>
          </article>

          <article className="profile-security__danger profile-security__card--wide">
            <div>
              <p className="archive-label">Permanent deletion</p>
              <h3 className="font-display">
                Delete your account.
              </h3>
              <p className="profile-security__description">
                This permanently deletes your account and synced CineScope data. It also clears this device. This cannot be undone, so download your data first if needed.
              </p>
            </div>

            <form
              className="profile-security__form"
              onSubmit={handleDeleteSubmit}
            >
              <label>
                <span>Current password</span>
                <input
                  autoComplete="current-password"
                  disabled={isDeleting}
                  onChange={(event) =>
                    setDeletePassword(event.target.value)
                  }
                  required
                  type="password"
                  value={deletePassword}
                />
              </label>
              <label>
                <span>
                  Type {ACCOUNT_DELETE_CONFIRMATION} to confirm
                </span>
                <input
                  autoComplete="off"
                  disabled={isDeleting}
                  onChange={(event) =>
                    setDeleteConfirmation(event.target.value)
                  }
                  required
                  spellCheck={false}
                  value={deleteConfirmation}
                />
              </label>

              <ProfileMessage message={deletionMessage} />

              <button
                className="profile-security__delete"
                disabled={
                  isDeleting ||
                  deleteConfirmation !==
                    ACCOUNT_DELETE_CONFIRMATION
                }
                type="submit"
              >
                {isDeleting
                  ? 'Deleting account…'
                  : 'Permanently delete my account'}
              </button>
            </form>
          </article>
        </div>
      </section>
    </section>
  )
}
