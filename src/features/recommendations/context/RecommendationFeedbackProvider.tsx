import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useAuth } from '../../auth/hooks/useAuth'
import type { LibraryMediaType } from '../../library/data/library'
import {
  loadCloudRecommendationFeedback,
  saveCloudRecommendationFeedback,
  subscribeToCloudRecommendationFeedback,
} from '../data/cloudRecommendationFeedback'
import {
  addNotInterestedRecord,
  createDefaultRecommendationFeedback,
  getRecommendationFeedbackStorageKey,
  mergeRecommendationFeedback,
  parseRecommendationFeedback,
  RECOMMENDATION_FEEDBACK_STORAGE_KEY,
  removeNotInterestedRecord,
  type RecommendationFeedback,
} from '../data/recommendationFeedback'
import {
  RecommendationFeedbackContext,
  type RecommendationFeedbackContextValue,
  type RecommendationFeedbackSyncStatus,
} from './RecommendationFeedbackContext'

function loadLocalFeedback(
  storageKey: string,
): RecommendationFeedback {
  if (typeof window === 'undefined') {
    return createDefaultRecommendationFeedback()
  }

  const storedValue = window.localStorage.getItem(storageKey)

  if (!storedValue) {
    return createDefaultRecommendationFeedback()
  }

  try {
    return (
      parseRecommendationFeedback(
        JSON.parse(storedValue),
      ) ?? createDefaultRecommendationFeedback()
    )
  } catch {
    return createDefaultRecommendationFeedback()
  }
}

function saveLocalFeedback(
  storageKey: string,
  feedback: RecommendationFeedback,
): void {
  window.localStorage.setItem(
    storageKey,
    JSON.stringify(feedback),
  )
}

function initializeFeedback(
  userId: string | null,
): RecommendationFeedback {
  const storageKey =
    getRecommendationFeedbackStorageKey(userId)
  const storedFeedback = loadLocalFeedback(storageKey)

  if (!userId) return storedFeedback

  const guestFeedback = loadLocalFeedback(
    RECOMMENDATION_FEEDBACK_STORAGE_KEY,
  )

  if (
    guestFeedback.notInterestedRecordKeys.length === 0
  ) {
    return storedFeedback
  }

  const mergedFeedback = {
    ...mergeRecommendationFeedback(
      storedFeedback,
      guestFeedback,
    ),
    updatedAt: new Date().toISOString(),
  }

  saveLocalFeedback(storageKey, mergedFeedback)
  window.localStorage.removeItem(
    RECOMMENDATION_FEEDBACK_STORAGE_KEY,
  )

  return mergedFeedback
}

function isNewerFeedback(
  first: RecommendationFeedback,
  second: RecommendationFeedback,
): boolean {
  if (!first.updatedAt) return false
  if (!second.updatedAt) return true

  return first.updatedAt > second.updatedAt
}

function getFeedbackSyncErrorMessage(
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
    return 'Saved on this device. Feedback sync needs updated permissions.'
  }

  if (
    code.includes('unavailable') ||
    (typeof navigator !== 'undefined' &&
      !navigator.onLine)
  ) {
    return 'Saved on this device. Feedback sync is temporarily offline.'
  }

  return 'Saved on this device. Feedback sync could not finish.'
}

function RecommendationFeedbackStore({
  children,
  userId,
}: {
  children: ReactNode
  userId: string | null
}) {
  const storageKey =
    getRecommendationFeedbackStorageKey(userId)
  const [feedback, setFeedback] =
    useState<RecommendationFeedback>(() =>
      initializeFeedback(userId),
    )
  const [syncStatus, setSyncStatus] =
    useState<RecommendationFeedbackSyncStatus>(
      userId ? 'connecting' : 'local',
    )
  const [syncError, setSyncError] = useState<
    string | null
  >(null)
  const [syncAttempt, setSyncAttempt] = useState(0)
  const feedbackRef = useRef(feedback)
  const isAccountDataClearedRef = useRef(false)
  const cloudWriteQueueRef = useRef<Promise<void>>(
    Promise.resolve(),
  )

  const commitFeedback = useCallback(
    (nextFeedback: RecommendationFeedback) => {
      if (isAccountDataClearedRef.current) {
        window.localStorage.removeItem(storageKey)
      } else {
        saveLocalFeedback(storageKey, nextFeedback)
      }

      feedbackRef.current = nextFeedback
      setFeedback(nextFeedback)
    },
    [storageKey],
  )

  const markSyncError = useCallback((error: unknown) => {
    setSyncError(getFeedbackSyncErrorMessage(error))
    setSyncStatus('error')
  }, [])

  const queueCloudSave = useCallback(
    (nextFeedback: RecommendationFeedback) => {
      if (!userId) return

      setSyncError(null)
      setSyncStatus('syncing')

      cloudWriteQueueRef.current =
        cloudWriteQueueRef.current
          .catch(() => undefined)
          .then(() => {
            if (isAccountDataClearedRef.current) return

            return saveCloudRecommendationFeedback(
              userId,
              nextFeedback,
            )
          })
          .then(() => {
            if (isAccountDataClearedRef.current) return

            setSyncStatus('synced')
          })
          .catch((error) => {
            if (!isAccountDataClearedRef.current) {
              markSyncError(error)
            }
          })
    },
    [markSyncError, userId],
  )

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== storageKey) return

      if (!event.newValue) {
        commitFeedback(
          createDefaultRecommendationFeedback(),
        )
        return
      }

      try {
        const nextFeedback = parseRecommendationFeedback(
          JSON.parse(event.newValue),
        )

        if (nextFeedback) {
          commitFeedback(nextFeedback)
        }
      } catch {
        // Ignore malformed changes from another browser tab.
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [commitFeedback, storageKey])

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

    async function synchronizeFeedback(): Promise<void> {
      try {
        const cloudFeedback =
          await loadCloudRecommendationFeedback(
            activeUserId,
          )

        if (isCancelled) return

        const localFeedback = feedbackRef.current

        setSyncStatus('syncing')

        if (
          cloudFeedback &&
          !isNewerFeedback(
            localFeedback,
            cloudFeedback,
          )
        ) {
          commitFeedback(cloudFeedback)
        } else if (localFeedback.updatedAt) {
          await saveCloudRecommendationFeedback(
            activeUserId,
            localFeedback,
          )
        }

        if (isCancelled) return

        unsubscribe =
          await subscribeToCloudRecommendationFeedback(
            activeUserId,
            {
              onChange: (cloudUpdate) => {
                if (
                  isCancelled ||
                  !cloudUpdate ||
                  isNewerFeedback(
                    feedbackRef.current,
                    cloudUpdate,
                  )
                ) {
                  return
                }

                commitFeedback(cloudUpdate)
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

    void synchronizeFeedback()

    return () => {
      isCancelled = true
      unsubscribe?.()
    }
  }, [
    commitFeedback,
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

  const dismissRecommendation = useCallback(
    (mediaType: LibraryMediaType, id: number) => {
      const nextFeedback = addNotInterestedRecord(
        feedbackRef.current,
        mediaType,
        id,
      )

      commitFeedback(nextFeedback)
      queueCloudSave(nextFeedback)
    },
    [commitFeedback, queueCloudSave],
  )

  const restoreRecommendation = useCallback(
    (mediaType: LibraryMediaType, id: number) => {
      const nextFeedback = removeNotInterestedRecord(
        feedbackRef.current,
        mediaType,
        id,
      )

      commitFeedback(nextFeedback)
      queueCloudSave(nextFeedback)
    },
    [commitFeedback, queueCloudSave],
  )

  const retrySync = useCallback(() => {
    if (userId) {
      setSyncAttempt((attempt) => attempt + 1)
    }
  }, [userId])

  const clearAccountData = useCallback(() => {
    isAccountDataClearedRef.current = true
    window.localStorage.removeItem(storageKey)
    commitFeedback(createDefaultRecommendationFeedback())
  }, [commitFeedback, storageKey])

  const value = useMemo<RecommendationFeedbackContextValue>(
    () => ({
      clearAccountData,
      dismissRecommendation,
      feedback,
      restoreRecommendation,
      retrySync,
      syncError,
      syncStatus,
    }),
    [
      clearAccountData,
      dismissRecommendation,
      feedback,
      restoreRecommendation,
      retrySync,
      syncError,
      syncStatus,
    ],
  )

  return (
    <RecommendationFeedbackContext.Provider value={value}>
      {children}
    </RecommendationFeedbackContext.Provider>
  )
}

export function RecommendationFeedbackProvider({
  children,
}: {
  children: ReactNode
}) {
  const { status, user } = useAuth()
  const userId =
    status === 'authenticated' && user ? user.uid : null

  return (
    <RecommendationFeedbackStore
      key={userId ?? 'guest'}
      userId={userId}
    >
      {children}
    </RecommendationFeedbackStore>
  )
}
