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
  AUTH_DISPLAY_NAME_MAX_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  getAuthErrorMessage,
  getAuthRedirectTarget,
  normalizeAuthEmail,
} from '../data/auth'
import { useAuth } from '../hooks/useAuth'

export function RegisterPage() {
  const location = useLocation()
  const { register, status } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] =
    useState('')
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null)
  const [isSubmitting, setIsSubmitting] =
    useState(false)
  const redirectTarget = getAuthRedirectTarget(
    location.state,
  )

  useEffect(() => {
    document.title = 'Create Account — CineScope'
  }, [])

  if (status === 'authenticated') {
    return <Navigate replace to={redirectTarget} />
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()
    setErrorMessage(null)

    const normalizedName = displayName.trim()
    const normalizedEmail = normalizeAuthEmail(email)

    if (normalizedName.length < 2) {
      setErrorMessage(
        'Enter at least two characters for your display name.',
      )
      return
    }

    if (!normalizedEmail) {
      setErrorMessage('Enter a valid email address.')
      return
    }

    if (password.length < AUTH_PASSWORD_MIN_LENGTH) {
      setErrorMessage(
        `Use at least ${AUTH_PASSWORD_MIN_LENGTH} characters for your password.`,
      )
      return
    }

    if (password !== passwordConfirmation) {
      setErrorMessage('The two passwords do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      await register({
        displayName: normalizedName,
        email: normalizedEmail,
        password,
      })
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthPageFrame
      description="Create a persistent Firebase identity for the account layer while keeping the current library private to this browser."
      eyebrow="New membership"
      index="02"
      title="Begin your own archive."
    >
      {status === 'unconfigured' ? (
        <AuthConfigurationNotice />
      ) : (
        <>
          <div className="auth-form__heading">
            <p>New member record</p>
            <h2 className="font-display">
              Establish your identity.
            </h2>
          </div>

          <form
            className="auth-form"
            noValidate
            onSubmit={handleSubmit}
          >
            <label>
              <span>Display name</span>
              <input
                autoComplete="name"
                disabled={isSubmitting}
                maxLength={AUTH_DISPLAY_NAME_MAX_LENGTH}
                name="name"
                onChange={(event) =>
                  setDisplayName(event.target.value)
                }
                placeholder="How CineScope should address you"
                required
                value={displayName}
              />
            </label>

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

            <div className="auth-form__pair">
              <label>
                <span>Password</span>
                <input
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  minLength={AUTH_PASSWORD_MIN_LENGTH}
                  name="password"
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                  type="password"
                  value={password}
                />
              </label>

              <label>
                <span>Confirm password</span>
                <input
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  minLength={AUTH_PASSWORD_MIN_LENGTH}
                  name="password-confirmation"
                  onChange={(event) =>
                    setPasswordConfirmation(
                      event.target.value,
                    )
                  }
                  required
                  type="password"
                  value={passwordConfirmation}
                />
              </label>
            </div>

            <p className="auth-form__guidance">
              Use at least {AUTH_PASSWORD_MIN_LENGTH}{' '}
              characters. Your Firebase project may enforce
              additional password rules.
            </p>

            {errorMessage ? (
              <p
                className="auth-form__message auth-form__message--error"
                role="alert"
              >
                {errorMessage}
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
                ? 'Creating account…'
                : 'Create CineScope account'}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="auth-form__alternate">
            <p>
              Already have an account?{' '}
              <Link state={location.state} to="/login">
                Sign in
              </Link>
            </p>
          </div>
        </>
      )}
    </AuthPageFrame>
  )
}
