import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpsError } from 'firebase-functions/v2/https'

import {
  createDeleteAccountHandler,
  RECENT_LOGIN_MAX_AGE_SECONDS,
} from './deleteAccount.js'

describe('account deletion callable', () => {
  const deleteAuthUser = vi.fn(async () => undefined)
  const deleteUserData = vi.fn(async () => undefined)
  const logger = {
    error: vi.fn(),
    info: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createHandler() {
    return createDeleteAccountHandler({
      deleteAuthUser,
      deleteUserData,
      logger,
      nowSeconds: () => 10_000,
    })
  }

  it('rejects requests without a verified Firebase identity', async () => {
    await expect(createHandler()({})).rejects.toMatchObject<
      Partial<HttpsError>
    >({ code: 'unauthenticated' })

    expect(deleteUserData).not.toHaveBeenCalled()
    expect(deleteAuthUser).not.toHaveBeenCalled()
  })

  it('requires a recently reauthenticated identity token', async () => {
    await expect(
      createHandler()({
        auth: {
          token: {
            auth_time:
              10_000 - RECENT_LOGIN_MAX_AGE_SECONDS - 1,
          },
          uid: 'member-123',
        },
      }),
    ).rejects.toMatchObject<Partial<HttpsError>>({
      code: 'failed-precondition',
    })

    expect(deleteUserData).not.toHaveBeenCalled()
    expect(deleteAuthUser).not.toHaveBeenCalled()
  })

  it('recursively removes account data before deleting the Auth user', async () => {
    const callOrder: string[] = []
    deleteUserData.mockImplementationOnce(async () => {
      callOrder.push('data')
    })
    deleteAuthUser.mockImplementationOnce(async () => {
      callOrder.push('auth')
    })

    await expect(
      createHandler()({
        auth: {
          token: { auth_time: 9_900 },
          uid: 'member-123',
        },
      }),
    ).resolves.toEqual({ deleted: true })

    expect(callOrder).toEqual(['data', 'auth'])
    expect(deleteUserData).toHaveBeenCalledWith(
      'member-123',
    )
    expect(deleteAuthUser).toHaveBeenCalledWith(
      'member-123',
    )
    expect(logger.info).toHaveBeenCalledWith(
      'account_deletion_completed',
      expect.objectContaining({ userId: 'member-123' }),
    )
  })

  it('preserves the Auth user when account-data cleanup fails', async () => {
    deleteUserData.mockRejectedValueOnce(
      new Error('Firestore unavailable'),
    )

    await expect(
      createHandler()({
        auth: {
          token: { auth_time: 9_900 },
          uid: 'member-123',
        },
      }),
    ).rejects.toMatchObject<Partial<HttpsError>>({
      code: 'internal',
    })

    expect(deleteAuthUser).not.toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledWith(
      'account_data_deletion_failed',
      expect.objectContaining({ userId: 'member-123' }),
    )
  })

  it('returns a retryable normalized failure when Auth deletion fails', async () => {
    deleteAuthUser.mockRejectedValueOnce(
      new Error('Auth unavailable'),
    )

    await expect(
      createHandler()({
        auth: {
          token: { auth_time: 9_900 },
          uid: 'member-123',
        },
      }),
    ).rejects.toMatchObject<Partial<HttpsError>>({
      code: 'internal',
    })

    expect(logger.error).toHaveBeenCalledWith(
      'account_auth_deletion_failed',
      expect.objectContaining({ userId: 'member-123' }),
    )
  })
})
