import type { AuthUser } from '../../auth/context/AuthContext'
import type {
  LibraryRecord,
  LibrarySyncStatus,
} from '../../library/data/library'

export const ACCOUNT_EXPORT_SCHEMA_VERSION = 2

export type CineScopeAccountExport = {
  account: AuthUser
  archive: {
    records: LibraryRecord[]
    syncStatus: LibrarySyncStatus
  }
  exportedAt: string
  product: 'CineScope'
  schemaVersion: typeof ACCOUNT_EXPORT_SCHEMA_VERSION
}

export function buildAccountExport({
  exportedAt = new Date().toISOString(),
  records,
  syncStatus,
  user,
}: {
  exportedAt?: string
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
