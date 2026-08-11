import type { AuthUser } from '../../auth/context/AuthContext'
import type {
  LibraryRecord,
  LibrarySyncStatus,
} from '../../library/data/library'
import type { UserPreferences } from '../../preferences/data/preferences'

export const ACCOUNT_EXPORT_SCHEMA_VERSION = 3

export type CineScopeAccountExport = {
  account: AuthUser
  archive: {
    records: LibraryRecord[]
    syncStatus: LibrarySyncStatus
  }
  exportedAt: string
  preferences: UserPreferences
  product: 'CineScope'
  schemaVersion: typeof ACCOUNT_EXPORT_SCHEMA_VERSION
}

export function buildAccountExport({
  exportedAt = new Date().toISOString(),
  preferences,
  records,
  syncStatus,
  user,
}: {
  exportedAt?: string
  preferences: UserPreferences
  records: LibraryRecord[]
  syncStatus: LibrarySyncStatus
  user: AuthUser
}): CineScopeAccountExport {
  return {
    account: { ...user },
    archive: {
      records: [...records].sort((first, second) =>
        second.updatedAt.localeCompare(first.updatedAt),
      ),
      syncStatus,
    },
    exportedAt,
    preferences: {
      ...preferences,
      favoriteGenres: [...preferences.favoriteGenres],
    },
    product: 'CineScope',
    schemaVersion: ACCOUNT_EXPORT_SCHEMA_VERSION,
  }
}

export function downloadAccountExport(
  accountExport: CineScopeAccountExport,
): void {
  const blob = new Blob(
    [JSON.stringify(accountExport, null, 2)],
    { type: 'application/json' },
  )
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = `cinescope-account-export-${accountExport.exportedAt.slice(0, 10)}.json`
  link.hidden = true
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}
