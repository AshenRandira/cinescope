import { createContext } from 'react'

import type { LibraryMediaType } from '../../library/data/library'
import type { RecommendationFeedback } from '../data/recommendationFeedback'

export type RecommendationFeedbackSyncStatus =
  | 'connecting'
  | 'error'
  | 'local'
  | 'synced'
  | 'syncing'

export type RecommendationFeedbackContextValue = {
  clearAccountData: () => void
  dismissRecommendation: (
    mediaType: LibraryMediaType,
    id: number,
  ) => void
  feedback: RecommendationFeedback
  restoreRecommendation: (
    mediaType: LibraryMediaType,
    id: number,
  ) => void
  retrySync: () => void
  syncError: string | null
  syncStatus: RecommendationFeedbackSyncStatus
}

export const RecommendationFeedbackContext =
  createContext<RecommendationFeedbackContextValue | null>(
    null,
  )
