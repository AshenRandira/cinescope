import { createContext } from 'react'

import type {
  LibraryCandidate,
  LibraryMediaType,
  LibraryRecord,
  LibraryRecordPatch,
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
  updateRecord: (
    candidate: LibraryCandidate,
    patch?: LibraryRecordPatch,
  ) => void
}

export const LibraryContext =
  createContext<LibraryContextValue | null>(null)
