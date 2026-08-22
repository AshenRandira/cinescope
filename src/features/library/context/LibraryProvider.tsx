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
  deleteCloudLibraryRecord,
  loadCloudLibrary,
  saveCloudLibraryRecord,
  subscribeToCloudLibrary,
  type CloudLibraryChange,
} from '../data/cloudLibrary'
import {
  getLibraryPendingDeletionStorageKey,
  getLibraryRecordKey,
  getLibraryStorageKey,
  LIBRARY_STORAGE_KEY,
  mergeLibraryRecords,
  parseLibraryRecords,
  sortLibraryRecords,
  type LibraryCandidate,
  type LibraryMediaType,
  type LibraryRecord,
  type LibraryRecordPatch,
  type LibrarySyncStatus,
} from '../data/library'
import { areTvProgressEqual } from '../data/tvProgress'

import {
  LibraryContext,
  type LibraryContextValue,
} from './LibraryContext'

function loadLibraryRecords(
  storageKey: string,
): LibraryRecord[] {
  if (typeof window === 'undefined') return []

  return sortLibraryRecords(
    parseLibraryRecords(
      window.localStorage.getItem(storageKey),
    ),
  )
}

function saveLibraryRecords(
  storageKey: string,
  records: LibraryRecord[],
): void {
  window.localStorage.setItem(
    storageKey,
    JSON.stringify(records),
  )
}

function initializeLibraryRecords(
  userId: string | null,
): LibraryRecord[] {
  const storageKey = getLibraryStorageKey(userId)
  const storedRecords = loadLibraryRecords(storageKey)

  if (!userId) return storedRecords

  const guestRecords = loadLibraryRecords(
    LIBRARY_STORAGE_KEY,
  )

  if (guestRecords.length === 0) {
    return storedRecords
  }

  const migratedRecords = mergeLibraryRecords(
    storedRecords,
    guestRecords,
  )

  saveLibraryRecords(storageKey, migratedRecords)
  window.localStorage.removeItem(LIBRARY_STORAGE_KEY)

  return migratedRecords
}

function loadPendingDeletionKeys(
  userId: string,
): Set<string> {
  const value = window.localStorage.getItem(
    getLibraryPendingDeletionStorageKey(userId),
  )

  if (!value) return new Set()

  try {
    const parsedValue: unknown = JSON.parse(value)

    if (!Array.isArray(parsedValue)) return new Set()

    return new Set(
      parsedValue.filter(
        (item): item is string =>
          typeof item === 'string' &&
          /^(movie|tv):[1-9]\d*$/.test(item),
      ),
    )
  } catch {
    return new Set()
  }
}

function savePendingDeletionKeys(
  userId: string,
  keys: Set<string>,
): void {
  const storageKey =
    getLibraryPendingDeletionStorageKey(userId)

  if (keys.size === 0) {
    window.localStorage.removeItem(storageKey)
    return
  }

  window.localStorage.setItem(
    storageKey,
    JSON.stringify([...keys]),
  )
}

function addPendingDeletionKey(
  userId: string,
  recordKey: string,
): void {
  const keys = loadPendingDeletionKeys(userId)
  keys.add(recordKey)
  savePendingDeletionKeys(userId, keys)
}

function removePendingDeletionKey(
  userId: string,
  recordKey: string,
): void {
  const keys = loadPendingDeletionKeys(userId)
  keys.delete(recordKey)
  savePendingDeletionKeys(userId, keys)
}

function parseLibraryRecordKey(recordKey: string): {
  id: number
  mediaType: LibraryMediaType
} | null {
  const [mediaType, idValue] = recordKey.split(':')
  const id = Number(idValue)

  if (
    (mediaType !== 'movie' && mediaType !== 'tv') ||
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return null
  }

  return { id, mediaType }
}

function getCloudSyncErrorMessage(
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
    return 'Saved on this device. Cloud sync needs updated Firestore rules.'
  }

  if (
    code.includes('unavailable') ||
    (typeof navigator !== 'undefined' &&
      !navigator.onLine)
  ) {
    return 'Saved on this device. Cloud sync is temporarily offline.'
  }

  return 'Saved on this device. Cloud sync could not finish.'
}

function applyCloudChanges(
  records: LibraryRecord[],
  changes: CloudLibraryChange[],
  pendingDeletionKeys: Set<string>,
): LibraryRecord[] {
  let nextRecords = records

  changes.forEach((change) => {
    if (pendingDeletionKeys.has(change.recordKey)) {
      return
    }

    if (change.type === 'removed') {
      nextRecords = nextRecords.filter(
        (record) =>
          getLibraryRecordKey(
            record.mediaType,
            record.id,
          ) !== change.recordKey,
      )
      return
    }

    if (!change.record) return

    nextRecords = mergeLibraryRecords(
      nextRecords,
      [change.record],
    )
  })

  return sortLibraryRecords(nextRecords)
}

function areLibraryRecordsEqual(
  first: LibraryRecord,
  second: LibraryRecord,
): boolean {
  return (
    first.backdropPath === second.backdropPath &&
    first.id === second.id &&
    first.isFavorite === second.isFavorite &&
    first.isWatched === second.isWatched &&
    first.mediaType === second.mediaType &&
    first.overview === second.overview &&
    first.posterPath === second.posterPath &&
    first.releaseYear === second.releaseYear &&
    first.savedAt === second.savedAt &&
    first.title === second.title &&
    areTvProgressEqual(
      first.tvProgress,
      second.tvProgress,
    ) &&
    first.updatedAt === second.updatedAt &&
    first.userRating === second.userRating
  )
}

function LibraryStore({
  children,
  userId,
}: {
  children: ReactNode
  userId: string | null
}) {
  const storageKey = getLibraryStorageKey(userId)
  const [records, setRecords] = useState<
    LibraryRecord[]
  >(() => initializeLibraryRecords(userId))
  const [syncStatus, setSyncStatus] =
    useState<LibrarySyncStatus>(
      userId ? 'connecting' : 'local',
    )
  const [syncError, setSyncError] = useState<
    string | null
  >(null)
  const [syncAttempt, setSyncAttempt] = useState(0)
  const recordsRef = useRef(records)
  const cloudErrorRef = useRef<string | null>(null)
  const pendingCloudOperationsRef = useRef(0)
  const isAccountDataClearedRef = useRef(false)

  const commitRecords = useCallback(
    (nextRecords: LibraryRecord[]) => {
      if (isAccountDataClearedRef.current) {
        window.localStorage.removeItem(storageKey)
      } else {
        saveLibraryRecords(storageKey, nextRecords)
      }

      recordsRef.current = nextRecords
      setRecords(nextRecords)
    },
    [storageKey],
  )

  const markCloudError = useCallback(
    (error: unknown) => {
      const message = getCloudSyncErrorMessage(error)
      cloudErrorRef.current = message
      setSyncError(message)
      setSyncStatus('error')
    },
    [],
  )

  const runCloudOperation = useCallback(
    (operation: () => Promise<void>) => {
      const wasAlreadyPaused =
        cloudErrorRef.current !== null
      pendingCloudOperationsRef.current += 1

      if (!wasAlreadyPaused) {
        setSyncStatus('syncing')
      }

      void operation()
        .catch(markCloudError)
        .finally(() => {
          pendingCloudOperationsRef.current -= 1

          if (
            pendingCloudOperationsRef.current === 0 &&
            cloudErrorRef.current === null
          ) {
            setSyncStatus('synced')
          }
        })
    },
    [markCloudError],
  )

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== storageKey) return

      commitRecords(
        sortLibraryRecords(
          parseLibraryRecords(event.newValue),
        ),
      )
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(
        'storage',
        handleStorage,
      )
    }
  }, [commitRecords, storageKey])

  useEffect(() => {
    if (!userId) {
      cloudErrorRef.current = null
      setSyncError(null)
      setSyncStatus('local')
      return
    }

    const activeUserId = userId
    let isCancelled = false
    let unsubscribe: (() => void) | undefined

    cloudErrorRef.current = null
    setSyncError(null)
    setSyncStatus('connecting')

    async function synchronizeLibrary(): Promise<void> {
      try {
        const deletionKeys = loadPendingDeletionKeys(
          activeUserId,
        )

        setSyncStatus('syncing')

        await Promise.all(
          [...deletionKeys].map(async (recordKey) => {
            const identity =
              parseLibraryRecordKey(recordKey)

            if (!identity) return

            await deleteCloudLibraryRecord(
              activeUserId,
              identity.mediaType,
              identity.id,
            )
            removePendingDeletionKey(
              activeUserId,
              recordKey,
            )
          }),
        )

        const cloudRecords = await loadCloudLibrary(
          activeUserId,
        )

        if (isCancelled) return

        const currentDeletionKeys =
          loadPendingDeletionKeys(activeUserId)
        const availableCloudRecords =
          cloudRecords.filter(
            (record) =>
              !currentDeletionKeys.has(
                getLibraryRecordKey(
                  record.mediaType,
                  record.id,
                ),
              ),
          )
        const localRecords = recordsRef.current
        const mergedRecords = mergeLibraryRecords(
          localRecords,
          availableCloudRecords,
        )
        const cloudRecordsByKey = new Map(
          availableCloudRecords.map((record) => [
            getLibraryRecordKey(
              record.mediaType,
              record.id,
            ),
            record,
          ]),
        )

        commitRecords(mergedRecords)

        await Promise.all(
          mergedRecords.map((record) => {
            const cloudRecord = cloudRecordsByKey.get(
              getLibraryRecordKey(
                record.mediaType,
                record.id,
              ),
            )

            if (
              cloudRecord &&
              areLibraryRecordsEqual(
                cloudRecord,
                record,
              )
            ) {
              return Promise.resolve()
            }

            return saveCloudLibraryRecord(
              activeUserId,
              record,
            )
          }),
        )

        if (isCancelled) return

        unsubscribe = await subscribeToCloudLibrary(
          activeUserId,
          {
            onChange: (changes) => {
              if (isCancelled) return

              const nextRecords = applyCloudChanges(
                recordsRef.current,
                changes,
                loadPendingDeletionKeys(activeUserId),
              )
              commitRecords(nextRecords)
            },
            onError: markCloudError,
          },
        )

        if (isCancelled) {
          unsubscribe()
          return
        }

        if (
          pendingCloudOperationsRef.current === 0 &&
          cloudErrorRef.current === null
        ) {
          setSyncStatus('synced')
        }
      } catch (error) {
        if (!isCancelled) {
          markCloudError(error)
        }
      }
    }

    void synchronizeLibrary()

    return () => {
      isCancelled = true
      unsubscribe?.()
    }
  }, [
    commitRecords,
    markCloudError,
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

  const getRecord = useCallback(
    (
      mediaType: LibraryMediaType,
      id: number,
    ): LibraryRecord | null =>
      records.find(
        (record) =>
          record.mediaType === mediaType &&
          record.id === id,
      ) ?? null,
    [records],
  )

  const updateRecord = useCallback(
    (
      candidate: LibraryCandidate,
      patch: LibraryRecordPatch = {},
    ): void => {
      const recordKey = getLibraryRecordKey(
        candidate.mediaType,
        candidate.id,
      )
      const existingRecord = recordsRef.current.find(
        (record) =>
          getLibraryRecordKey(
            record.mediaType,
            record.id,
          ) === recordKey,
      )
      const timestamp = new Date().toISOString()
      const nextRecord: LibraryRecord = {
        ...candidate,
        isFavorite:
          patch.isFavorite ??
          existingRecord?.isFavorite ??
          false,
        isWatched:
          patch.isWatched ??
          existingRecord?.isWatched ??
          false,
        savedAt: existingRecord?.savedAt ?? timestamp,
        tvProgress:
          'tvProgress' in patch
            ? patch.tvProgress ?? null
            : existingRecord?.tvProgress ?? null,
        updatedAt: timestamp,
        userRating:
          'userRating' in patch
            ? patch.userRating ?? null
            : existingRecord?.userRating ?? null,
      }
      const nextRecords = sortLibraryRecords([
        nextRecord,
        ...recordsRef.current.filter(
          (record) =>
            getLibraryRecordKey(
              record.mediaType,
              record.id,
            ) !== recordKey,
        ),
      ])

      commitRecords(nextRecords)

      if (userId) {
        removePendingDeletionKey(userId, recordKey)
        runCloudOperation(() =>
          saveCloudLibraryRecord(userId, nextRecord),
        )
      }
    },
    [commitRecords, runCloudOperation, userId],
  )

  const removeRecord = useCallback(
    (
      mediaType: LibraryMediaType,
      id: number,
    ): void => {
      const recordKey = getLibraryRecordKey(
        mediaType,
        id,
      )
      const nextRecords = recordsRef.current.filter(
        (record) =>
          getLibraryRecordKey(
            record.mediaType,
            record.id,
          ) !== recordKey,
      )

      commitRecords(nextRecords)

      if (userId) {
        addPendingDeletionKey(userId, recordKey)
        runCloudOperation(async () => {
          await deleteCloudLibraryRecord(
            userId,
            mediaType,
            id,
          )
          removePendingDeletionKey(userId, recordKey)
        })
      }
    },
    [commitRecords, runCloudOperation, userId],
  )

  const retrySync = useCallback(() => {
    if (userId) {
      setSyncAttempt((attempt) => attempt + 1)
    }
  }, [userId])

  const clearAccountData = useCallback(() => {
    if (!userId) return

    isAccountDataClearedRef.current = true
    window.localStorage.removeItem(storageKey)
    window.localStorage.removeItem(
      getLibraryPendingDeletionStorageKey(userId),
    )
    commitRecords([])
  }, [commitRecords, storageKey, userId])

  const value = useMemo<LibraryContextValue>(
    () => ({
      clearAccountData,
      getRecord,
      records,
      removeRecord,
      retrySync,
      syncError,
      syncStatus,
      updateRecord,
    }),
    [
      clearAccountData,
      getRecord,
      records,
      removeRecord,
      retrySync,
      syncError,
      syncStatus,
      updateRecord,
    ],
  )

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  )
}

export function LibraryProvider({
  children,
}: {
  children: ReactNode
}) {
  const { status, user } = useAuth()
  const userId =
    status === 'authenticated' && user
      ? user.uid
      : null

  return (
    <LibraryStore
      key={userId ?? 'guest'}
      userId={userId}
    >
      {children}
    </LibraryStore>
  )
}
