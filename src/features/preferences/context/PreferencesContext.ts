import { createContext } from 'react'

import type {
  UserPreferenceInput,
  UserPreferences,
} from '../data/preferences'

export type PreferenceSyncStatus =
  | 'connecting'
  | 'error'
  | 'local'
  | 'synced'
  | 'syncing'

export type PreferencesContextValue = {
  clearAccountData: () => void
  preferences: UserPreferences
  retrySync: () => void
  savePreferences: (
    preferences: UserPreferenceInput,
  ) => Promise<void>
  syncError: string | null
  syncStatus: PreferenceSyncStatus
}

export const PreferencesContext =
  createContext<PreferencesContextValue | null>(null)
