import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useAuth } from '../../auth/hooks/useAuth'
import {
  loadCloudPreferences,
  saveCloudPreferences,
  subscribeToCloudPreferences,
} from '../data/cloudPreferences'
import {
  createDefaultPreferences,
  getPreferencesStorageKey,
  normalizePreferenceInput,
  parseUserPreferences,
  type UserPreferenceInput,
  type UserPreferences,
} from '../data/preferences'
import {
  PreferencesContext,
  type PreferencesContextValue,
  type PreferenceSyncStatus,
} from './PreferencesContext'

function loadLocalPreferences(
  storageKey: string,
): UserPreferences {
  if (typeof window === 'undefined') {
    return createDefaultPreferences()
  }

  const storedValue = window.localStorage.getItem(storageKey)

  if (!storedValue) return createDefaultPreferences()

  try {
    return (
      parseUserPreferences(JSON.parse(storedValue)) ??
      createDefaultPreferences()
    )
  } catch {
    return createDefaultPreferences()
  }
}

function saveLocalPreferences(
  storageKey: string,
  preferences: UserPreferences,
): void {
  window.localStorage.setItem(
    storageKey,
    JSON.stringify(preferences),
  )
}

function isNewerPreferenceRecord(
  first: UserPreferences,
  second: UserPreferences,
): boolean {
  if (!first.updatedAt) return false
  if (!second.updatedAt) return true

  return first.updatedAt > second.updatedAt
}

function getPreferenceSyncErrorMessage(
  error: unknown,
): string {
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
      ? error.code
      : ''

  if (code.includes('permission-denied')) {
    return 'Saved on this device. Preference sync needs updated permissions.'
  }

  if (
    code.includes('unavailable') ||
    (typeof navigator !== 'undefined' && !navigator.onLine)
  ) {
    return 'Saved on this device. Preference sync is temporarily offline.'
  }

  return 'Saved on this device. Preference sync could not finish.'
}

function PreferencesStore({
  children,
  userId,
}: {
  children: ReactNode
  userId: string | null
}) {
  const storageKey = userId
    ? getPreferencesStorageKey(userId)
    : null
  const [preferences, setPreferences] =
    useState<UserPreferences>(() =>
      storageKey
        ? loadLocalPreferences(storageKey)
        : createDefaultPreferences(),
    )
  const [syncStatus, setSyncStatus] =
    useState<PreferenceSyncStatus>(
      userId ? 'connecting' : 'local',
    )
  const [syncError, setSyncError] = useState<
    string | null
  >(null)
  const [syncAttempt, setSyncAttempt] = useState(0)
  const preferencesRef = useRef(preferences)
  const isAccountDataClearedRef = useRef(false)

  const commitPreferences = useCallback(
    (nextPreferences: UserPreferences) => {
      if (storageKey) {
        if (isAccountDataClearedRef.current) {
          window.localStorage.removeItem(storageKey)
        } else {
          saveLocalPreferences(storageKey, nextPreferences)
        }
      }

      preferencesRef.current = nextPreferences
      setPreferences(nextPreferences)
    },
    [storageKey],
  )

  const markSyncError = useCallback((error: unknown) => {
    setSyncError(getPreferenceSyncErrorMessage(error))
    setSyncStatus('error')
  }, [])

  useEffect(() => {
    if (!storageKey) return

    function handleStorage(event: StorageEvent) {
      if (event.key !== storageKey || !event.newValue) return

      try {
        const nextPreferences = parseUserPreferences(
          JSON.parse(event.newValue),
        )

        if (nextPreferences) {
          commitPreferences(nextPreferences)
        }
      } catch {
        // Ignore malformed changes from another browser tab.
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [commitPreferences, storageKey])

  useEffect(() => {
    if (!userId) {
      setSyncError(null)
      setSyncStatus('local')
      return
    }

    const activeUserId = userId
    let isCancelled = false
    let unsubscribe: (() => void) | undefined

    setSyncError(null)
    setSyncStatus('connecting')

    async function synchronizePreferences(): Promise<void> {
      try {
        const cloudPreferences =
          await loadCloudPreferences(activeUserId)

        if (isCancelled) return

        const localPreferences = preferencesRef.current

        setSyncStatus('syncing')

        if (
          cloudPreferences &&
          !isNewerPreferenceRecord(
            localPreferences,
            cloudPreferences,
          )
        ) {
          commitPreferences(cloudPreferences)
        } else if (localPreferences.updatedAt) {
          await saveCloudPreferences(
            activeUserId,
            localPreferences,
          )
        }

        if (isCancelled) return

        unsubscribe = await subscribeToCloudPreferences(
          activeUserId,
          {
            onChange: (cloudUpdate) => {
              if (
                isCancelled ||
                !cloudUpdate ||
                isNewerPreferenceRecord(
                  preferencesRef.current,
                  cloudUpdate,
                )
              ) {
                return
              }

              commitPreferences(cloudUpdate)
              setSyncError(null)
              setSyncStatus('synced')
            },
            onError: markSyncError,
          },
        )

        if (isCancelled) {
          unsubscribe()
          return
        }

        setSyncStatus('synced')
      } catch (error) {
        if (!isCancelled) markSyncError(error)
      }
    }

    void synchronizePreferences()

    return () => {
      isCancelled = true
      unsubscribe?.()
    }
  }, [
    commitPreferences,
    markSyncError,
    syncAttempt,
    userId,
  ])

  useEffect(() => {
    if (!userId) return

    function handleOnline() {
      setSyncAttempt((attempt) => attempt + 1)
    }

    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [userId])

  const savePreferences = useCallback(
    async (input: UserPreferenceInput): Promise<void> => {
      const nextPreferences: UserPreferences = {
        ...normalizePreferenceInput(input),
        updatedAt: new Date().toISOString(),
      }

      commitPreferences(nextPreferences)

      if (!userId) {
        setSyncStatus('local')
        return
      }

      setSyncError(null)
      setSyncStatus('syncing')

      try {
        await saveCloudPreferences(userId, nextPreferences)
        setSyncStatus('synced')
      } catch (error) {
        markSyncError(error)
        throw error
      }
    },
    [commitPreferences, markSyncError, userId],
  )

  const retrySync = useCallback(() => {
    if (userId) {
      setSyncAttempt((attempt) => attempt + 1)
    }
  }, [userId])

  const clearAccountData = useCallback(() => {
    if (!storageKey) return

    isAccountDataClearedRef.current = true
    window.localStorage.removeItem(storageKey)
    commitPreferences(createDefaultPreferences())
  }, [commitPreferences, storageKey])

  const value = useMemo<PreferencesContextValue>(
    () => ({
      clearAccountData,
      preferences,
      retrySync,
      savePreferences,
      syncError,
      syncStatus,
    }),
    [
      clearAccountData,
      preferences,
      retrySync,
      savePreferences,
      syncError,
      syncStatus,
    ],
  )

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function PreferencesProvider({
  children,
}: {
  children: ReactNode
}) {
  const { status, user } = useAuth()
  const userId =
    status === 'authenticated' && user ? user.uid : null

  return (
    <PreferencesStore
      key={userId ?? 'guest'}
      userId={userId}
    >
      {children}
    </PreferencesStore>
  )
}
