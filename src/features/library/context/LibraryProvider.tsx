import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getLibraryRecordKey,
  LIBRARY_STORAGE_KEY,
  parseLibraryRecords,
  sortLibraryRecords,
  type LibraryCandidate,
  type LibraryMediaType,
  type LibraryRecord,
  type LibraryRecordPatch,
} from '../data/library'

import {
  LibraryContext,
  type LibraryContextValue,
} from './LibraryContext'

function loadLibraryRecords(): LibraryRecord[] {
  if (typeof window === 'undefined') return []

  return sortLibraryRecords(
    parseLibraryRecords(
      window.localStorage.getItem(
        LIBRARY_STORAGE_KEY,
      ),
    ),
  )
}

export function LibraryProvider({
  children,
}: {
  children: ReactNode
}) {
  const [records, setRecords] =
    useState<LibraryRecord[]>(loadLibraryRecords)

  useEffect(() => {
    window.localStorage.setItem(
      LIBRARY_STORAGE_KEY,
      JSON.stringify(records),
    )
  }, [records])

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== LIBRARY_STORAGE_KEY) {
        return
      }

      setRecords(
        sortLibraryRecords(
          parseLibraryRecords(event.newValue),
        ),
      )
    }

    window.addEventListener(
      'storage',
      handleStorage,
    )

    return () => {
      window.removeEventListener(
        'storage',
        handleStorage,
      )
    }
  }, [])

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
      setRecords((currentRecords) => {
        const recordKey = getLibraryRecordKey(
          candidate.mediaType,
          candidate.id,
        )
        const existingRecord = currentRecords.find(
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
          savedAt:
            existingRecord?.savedAt ?? timestamp,
          updatedAt: timestamp,
          userRating:
            'userRating' in patch
              ? patch.userRating ?? null
              : existingRecord?.userRating ?? null,
        }

        return sortLibraryRecords([
          nextRecord,
          ...currentRecords.filter(
            (record) =>
              getLibraryRecordKey(
                record.mediaType,
                record.id,
              ) !== recordKey,
          ),
        ])
      })
    },
    [],
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

      setRecords((currentRecords) =>
        currentRecords.filter(
          (record) =>
            getLibraryRecordKey(
              record.mediaType,
              record.id,
            ) !== recordKey,
        ),
      )
    },
    [],
  )

  const value = useMemo<LibraryContextValue>(
    () => ({
      getRecord,
      records,
      removeRecord,
      updateRecord,
    }),
    [
      getRecord,
      records,
      removeRecord,
      updateRecord,
    ],
  )

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  )
}
