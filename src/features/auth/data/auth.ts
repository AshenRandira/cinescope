export const AUTH_DISPLAY_NAME_MAX_LENGTH = 60
export const AUTH_PASSWORD_MIN_LENGTH = 8

const AUTH_ERROR_MESSAGES: Readonly<
  Record<string, string>
> = {
  'auth/email-already-in-use':
    'An account may already use this email address. Try signing in or reset the password.',
  'auth/invalid-credential':
    'The email address or password could not be verified.',
  'auth/invalid-email':
    'Enter a valid email address.',
  'auth/missing-password':
    'Enter your password to continue.',
  'auth/network-request-failed':
    'The authentication service could not be reached. Check your connection and try again.',
  'auth/operation-not-allowed':
    'Email and password authentication is not enabled for this Firebase project.',
  'auth/too-many-requests':
    'Too many attempts were made. Wait a little before trying again.',
  'auth/user-disabled':
    'This account is currently disabled.',
  'auth/user-not-found':
    'The email address or password could not be verified.',
  'auth/weak-password':
    'Choose a stronger password that meets the project password policy.',
  'auth/wrong-password':
    'The email address or password could not be verified.',
}

export function normalizeAuthEmail(
  email: string,
): string {
  return email.trim().toLowerCase()
}

export function getAuthErrorMessage(
  error: unknown,
): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return (
      AUTH_ERROR_MESSAGES[error.code] ??
      'Firebase could not complete this request. Try again.'
    )
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'The authentication request could not be completed.'
}

export function getAuthRedirectTarget(
  state: unknown,
): string {
  if (
    typeof state !== 'object' ||
    state === null ||
    !('from' in state) ||
    typeof state.from !== 'string' ||
    !state.from.startsWith('/') ||
    state.from.startsWith('//')
  ) {
    return '/profile'
  }

  return state.from
}
