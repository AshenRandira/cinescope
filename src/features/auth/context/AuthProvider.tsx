import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Auth, User } from 'firebase/auth'

import {
  getFirebaseAuth,
  getFirebaseAppCheckToken,
  getFirebaseFunctions,
  isFirebaseConfigured,
} from '../../../config/firebase'

import {
  getAuthErrorMessage,
  normalizeAuthEmail,
} from '../data/auth'
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
  type AuthUser,
  type RegisterCredentials,
} from './AuthContext'

async function getConfiguredAuth(): Promise<Auth> {
  const auth = await getFirebaseAuth()

  if (!auth) {
    throw new Error(
      'Account access is unavailable in this environment.',
    )
  }

  return auth
}

function toAuthUser(user: User): AuthUser {
  return {
    createdAt: user.metadata.creationTime ?? null,
    displayName: user.displayName,
    email: user.email,
    emailVerified: user.emailVerified,
    lastSignInAt:
      user.metadata.lastSignInTime ?? null,
    uid: user.uid,
  }
}

async function getCurrentFirebaseUser(
  auth: Auth,
): Promise<User> {
  const firebaseUser = auth.currentUser

  if (!firebaseUser) {
    throw new Error(
      'Sign in again before updating this account.',
    )
  }

  return firebaseUser
}

async function reauthenticateWithPassword(
  auth: Auth,
  password: string,
): Promise<User> {
  const firebaseUser = await getCurrentFirebaseUser(auth)

  if (!firebaseUser.email) {
    throw new Error(
      'This account does not have an email address available for password confirmation.',
    )
  }

  const {
    EmailAuthProvider,
    reauthenticateWithCredential,
  } = await import('firebase/auth')
  const credential = EmailAuthProvider.credential(
    firebaseUser.email,
    password,
  )

  await reauthenticateWithCredential(
    firebaseUser,
    credential,
  )

  return firebaseUser
}

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const [status, setStatus] = useState<AuthStatus>(
    isFirebaseConfigured
      ? 'initializing'
      : 'unconfigured',
  )
  const [user, setUser] = useState<AuthUser | null>(
    null,
  )
  const [sessionError, setSessionError] = useState<
    string | null
  >(null)

  useEffect(() => {
    let isCancelled = false
    let unsubscribe: (() => void) | undefined

    async function observeSession(): Promise<void> {
      const auth = await getFirebaseAuth()

      if (isCancelled) {
        return
      }

      if (!auth) {
        setStatus('unconfigured')
        return
      }

      const { onAuthStateChanged } = await import(
        'firebase/auth'
      )

      if (isCancelled) {
        return
      }

      unsubscribe = onAuthStateChanged(
        auth,
        (firebaseUser) => {
          setUser(
            firebaseUser
              ? toAuthUser(firebaseUser)
              : null,
          )
          setStatus(
            firebaseUser
              ? 'authenticated'
              : 'unauthenticated',
          )
          setSessionError(null)
        },
        (error) => {
          setUser(null)
          setStatus('unauthenticated')
          setSessionError(getAuthErrorMessage(error))
        },
      )
    }

    void observeSession().catch((error: unknown) => {
      if (!isCancelled) {
        setStatus('unauthenticated')
        setSessionError(getAuthErrorMessage(error))
      }
    })

    return () => {
      isCancelled = true
      unsubscribe?.()
    }
  }, [])

  const login = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<void> => {
      const [auth, { signInWithEmailAndPassword }] =
        await Promise.all([
          getConfiguredAuth(),
          import('firebase/auth'),
        ])

      await signInWithEmailAndPassword(
        auth,
        normalizeAuthEmail(email),
        password,
      )
    },
    [],
  )

  const register = useCallback(
    async ({
      displayName,
      email,
      password,
    }: RegisterCredentials): Promise<void> => {
      const [
        auth,
        {
          createUserWithEmailAndPassword,
          updateProfile,
        },
      ] = await Promise.all([
        getConfiguredAuth(),
        import('firebase/auth'),
      ])
      const credential =
        await createUserWithEmailAndPassword(
          auth,
          normalizeAuthEmail(email),
          password,
        )
      const normalizedName = displayName.trim()

      if (normalizedName) {
        await updateProfile(credential.user, {
          displayName: normalizedName,
        })
      }

      setUser(toAuthUser(credential.user))
      setStatus('authenticated')
    },
    [],
  )

  const logout = useCallback(async (): Promise<void> => {
    const [auth, { signOut }] = await Promise.all([
      getConfiguredAuth(),
      import('firebase/auth'),
    ])

    await signOut(auth)
  }, [])

  const resetPassword = useCallback(
    async (email: string): Promise<void> => {
      const [auth, { sendPasswordResetEmail }] =
        await Promise.all([
          getConfiguredAuth(),
          import('firebase/auth'),
        ])

      await sendPasswordResetEmail(
        auth,
        normalizeAuthEmail(email),
      )
    },
    [],
  )

  const updateDisplayName = useCallback(
    async (displayName: string): Promise<void> => {
      const [auth, { updateProfile }] =
        await Promise.all([
          getConfiguredAuth(),
          import('firebase/auth'),
        ])
      const firebaseUser = await getCurrentFirebaseUser(
        auth,
      )

      await updateProfile(firebaseUser, {
        displayName: displayName.trim(),
      })
      setUser(toAuthUser(firebaseUser))
    },
    [],
  )

  const sendVerificationEmail = useCallback(
    async (): Promise<void> => {
      const [auth, { sendEmailVerification }] =
        await Promise.all([
          getConfiguredAuth(),
          import('firebase/auth'),
        ])
      const firebaseUser = await getCurrentFirebaseUser(
        auth,
      )

      if (firebaseUser.emailVerified) return

      await sendEmailVerification(firebaseUser)
    },
    [],
  )

  const refreshUser = useCallback(
    async (): Promise<void> => {
      const [auth, { reload }] = await Promise.all([
        getConfiguredAuth(),
        import('firebase/auth'),
      ])
      const firebaseUser = await getCurrentFirebaseUser(
        auth,
      )

      await reload(firebaseUser)
      setUser(toAuthUser(firebaseUser))
    },
    [],
  )

  const changePassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string,
    ): Promise<void> => {
      const [auth, { updatePassword }] =
        await Promise.all([
          getConfiguredAuth(),
          import('firebase/auth'),
        ])
      const firebaseUser = await reauthenticateWithPassword(
        auth,
        currentPassword,
      )

      await updatePassword(firebaseUser, newPassword)
      setUser(toAuthUser(firebaseUser))
    },
    [],
  )

  const deleteAccount = useCallback(
    async (currentPassword: string): Promise<void> => {
      const [auth, functions] = await Promise.all([
        getConfiguredAuth(),
        getFirebaseFunctions(),
      ])

      if (!functions) {
        throw new Error(
          'The secure account service is not configured for this environment.',
        )
      }

      await reauthenticateWithPassword(
        auth,
        currentPassword,
      )
      await getFirebaseAppCheckToken()

      const { httpsCallable } = await import(
        'firebase/functions'
      )
      const result = await httpsCallable<
        undefined,
        { deleted?: boolean }
      >(functions, 'deleteAccount')()

      if (result.data.deleted !== true) {
        throw new Error(
          'Account deletion could not be completed. Try again.',
        )
      }
    },
    [],
  )

  const getIdToken = useCallback(
    async (
      forceRefresh = false,
    ): Promise<string | null> => {
      const auth = await getFirebaseAuth()

      if (!auth?.currentUser) {
        return null
      }

      return auth.currentUser.getIdToken(forceRefresh)
    },
    [],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      changePassword,
      deleteAccount,
      getIdToken,
      login,
      logout,
      register,
      refreshUser,
      resetPassword,
      sendVerificationEmail,
      sessionError,
      status,
      updateDisplayName,
      user,
    }),
    [
      changePassword,
      deleteAccount,
      getIdToken,
      login,
      logout,
      register,
      refreshUser,
      resetPassword,
      sendVerificationEmail,
      sessionError,
      status,
      updateDisplayName,
      user,
    ],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
