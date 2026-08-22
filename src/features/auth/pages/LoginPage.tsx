import {
  type FormEvent,
  useEffect,
  useState,
} from 'react'
import {
  Link,
  Navigate,
  useLocation,
} from 'react-router'

import { AuthConfigurationNotice } from '../components/AuthConfigurationNotice'
import { AuthPageFrame } from '../components/AuthPageFrame'
import {
  consumeAccountDeletionNotice,
  getAuthErrorMessage,
  getAuthRedirectTarget,
  normalizeAuthEmail,
} from '../data/auth'
import { useAuth } from '../hooks/useAuth'

type LoginMode = 'login' | 'reset'

export function LoginPage() {
  const location = useLocation()
  const {
    login,
    resetPassword,
    sessionError,
    status,
  } = useAuth()
  const [mode, setMode] = useState<LoginMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null)
  const [successMessage, setSuccessMessage] = useState<
    string | null
  >(null)
  const [storedAccountNotice] = useState(
    consumeAccountDeletionNotice,
  )
  const [isSubmitting, setIsSubmitting] =
    useState(false)
  const redirectTarget = getAuthRedirectTarget(
    location.state,
  )
  const accountNotice =
    typeof location.state === 'object' &&
    location.state !== null &&
    'notice' in location.state &&
    typeof location.state.notice === 'string'
      ? location.state.notice
      : storedAccountNotice

  useEffect(() => {
    document.title = 'Sign In — CineScope'
  }, [])

  if (status === 'authenticated') {
    return <Navigate replace to={redirectTarget} />
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    const normalizedEmail = normalizeAuthEmail(email)

    if (!normalizedEmail) {
      setErrorMessage(
        'Enter the email address attached to your account.',
      )
      return
    }

    if (mode === 'login' && !password) {
      setErrorMessage('Enter your password to continue.')
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'reset') {
        await resetPassword(normalizedEmail)
        setSuccessMessage(
          'If an account matches that address, Firebase will send password-reset instructions.',
        )
      } else {
        await login(normalizedEmail, password)
      }
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthPageFrame
      description="Sign in to access your saved movies, series, and preferences."
      eyebrow="Account access"
      index="01"
      title={
        mode === 'login'
          ? 'Resume your archive.'
          : 'Recover your account.'
      }
    >
      {status === 'unconfigured' ? (
        <AuthConfigurationNotice />
      ) : (
        <>
          <div className="auth-form__heading">
            <p>
              {mode === 'login'
                ? 'Returning member'
                : 'Password recovery'}
            </p>
            <h2 className="font-display">
              {mode === 'login'
                ? 'Sign in to continue.'
                : 'Request a reset link.'}
            </h2>
          </div>

          <form
            className="auth-form"
            noValidate
            onSubmit={handleSubmit}
          >
            <label>
              <span>Email address</span>
              <input
                autoComplete="email"
                disabled={isSubmitting}
                inputMode="email"
                name="email"
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </label>

            {mode === 'login' ? (
              <label>
                <span>Password</span>
                <input
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  name="password"
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                  type="password"
                  value={password}
                />
              </label>
            ) : null}

            {errorMessage ?? sessionError ? (
              <p
                className="auth-form__message auth-form__message--error"
                role="alert"
              >
                {errorMessage ?? sessionError}
              </p>
            ) : null}

            {successMessage ?? accountNotice ? (
              <p
                aria-live="polite"
                className="auth-form__message auth-form__message--success"
              >
                {successMessage ?? accountNotice}
              </p>
            ) : null}

            <button
              className="auth-form__submit"
              disabled={
                isSubmitting || status === 'initializing'
              }
              type="submit"
            >
              {isSubmitting
                ? 'Signing in…'
                : mode === 'login'
                  ? 'Sign in to CineScope'
                  : 'Send reset instructions'}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="auth-form__alternate">
            <button
              onClick={() => {
                setMode((currentMode) =>
                  currentMode === 'login'
                    ? 'reset'
                    : 'login',
                )
                setErrorMessage(null)
                setSuccessMessage(null)
              }}
              type="button"
            >
              {mode === 'login'
                ? 'Forgot your password?'
                : 'Return to sign in'}
            </button>

            <p>
              New to the archive?{' '}
              <Link state={location.state} to="/register">
                Create an account
              </Link>
            </p>
          </div>
        </>
      )}
    </AuthPageFrame>
  )
}
