import { createContext } from 'react'

import type {
  LibraryCandidate,
  LibraryMediaType,
  LibraryRecord,
  LibraryRecordPatch,
  LibrarySyncStatus,
} from '../data/library'

export type LibraryContextValue = {
  getRecord: (
    mediaType: LibraryMediaType,
    id: number,
  ) => LibraryRecord | null
  records: LibraryRecord[]
  removeRecord: (
    mediaType: LibraryMediaType,
    id: number,
  ) => void
  retrySync: () => void
  syncError: string | null
  syncStatus: LibrarySyncStatus
  updateRecord: (
    candidate: LibraryCandidate,
    patch?: LibraryRecordPatch,
  ) => void
}

export const LibraryContext =
  createContext<LibraryContextValue | null>(null)
