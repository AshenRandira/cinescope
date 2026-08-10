import { HttpsError } from 'firebase-functions/v2/https'

export const RECENT_LOGIN_MAX_AGE_SECONDS = 5 * 60

type AccountDeletionLogger = {
  error: (
    message: string,
    context: Record<string, string | number>,
  ) => void
  info: (
    message: string,
    context: Record<string, string | number>,
  ) => void
}

type AccountDeletionRequest = {
  auth?: {
    token: {
      auth_time?: unknown
    }
    uid: string
  }
}

export type AccountDeletionDependencies = {
  deleteAuthUser: (userId: string) => Promise<void>
  deleteUserData: (userId: string) => Promise<void>
  logger: AccountDeletionLogger
  nowSeconds?: () => number
}

export type AccountDeletionResult = {
  deleted: true
}

function getAuthAgeSeconds(
  authTime: unknown,
  nowSeconds: number,
): number | null {
  if (
    typeof authTime !== 'number' ||
    !Number.isFinite(authTime) ||
    authTime <= 0
  ) {
    return null
  }

  return Math.max(0, nowSeconds - authTime)
}

export function createDeleteAccountHandler({
  deleteAuthUser,
  deleteUserData,
  logger,
  nowSeconds = () => Math.floor(Date.now() / 1000),
}: AccountDeletionDependencies) {
  return async function deleteAccountHandler(
    request: AccountDeletionRequest,
  ): Promise<AccountDeletionResult> {
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'Sign in again before deleting this account.',
      )
    }

    const userId = request.auth.uid
    const authAgeSeconds = getAuthAgeSeconds(
      request.auth.token.auth_time,
      nowSeconds(),
    )

    if (
      authAgeSeconds === null ||
      authAgeSeconds > RECENT_LOGIN_MAX_AGE_SECONDS
    ) {
      throw new HttpsError(
        'failed-precondition',
        'Confirm your current password again before deleting this account.',
      )
    }

    try {
      await deleteUserData(userId)
    } catch {
      logger.error('account_data_deletion_failed', {
        authAgeSeconds,
        userId,
      })
      throw new HttpsError(
        'internal',
        'CineScope could not remove the account data. No authentication account was deleted. Try again.',
      )
    }

    try {
      await deleteAuthUser(userId)
    } catch {
      logger.error('account_auth_deletion_failed', {
        authAgeSeconds,
        userId,
      })
      throw new HttpsError(
        'internal',
        'The archive data was removed, but Firebase could not close the account. Try the deletion again.',
      )
    }

    logger.info('account_deletion_completed', {
      authAgeSeconds,
      userId,
    })

    return { deleted: true }
  }
}
