// @vitest-environment jsdom

import '../../../test/setup-dom'

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  MemoryRouter,
  Route,
  Routes,
} from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthContextValue } from '../../auth/context/AuthContext'
import { useAuth } from '../../auth/hooks/useAuth'
import type { LibraryContextValue } from '../../library/context/LibraryContext'
import { useLibrary } from '../../library/hooks/useLibrary'
import { downloadAccountExport } from '../data/accountExport'
import { ProfilePage } from './ProfilePage'

vi.mock('../../auth/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../library/hooks/useLibrary', () => ({
  useLibrary: vi.fn(),
}))

vi.mock('../data/accountExport', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('../data/accountExport')
    >()

  return {
    ...actual,
    downloadAccountExport: vi.fn(),
  }
})

const authUser = {
  createdAt: '2026-01-01T00:00:00.000Z',
  displayName: 'Archive Member',
  email: 'member@example.test',
  emailVerified: false,
  lastSignInAt: '2026-08-11T00:00:00.000Z',
  uid: 'member-123',
}

function createAuthValue(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    changePassword: vi.fn(async () => undefined),
    deleteAccount: vi.fn(async () => undefined),
    getIdToken: vi.fn(async () => null),
    login: vi.fn(async () => undefined),
    logout: vi.fn(async () => undefined),
    refreshUser: vi.fn(async () => undefined),
    register: vi.fn(async () => undefined),
    resetPassword: vi.fn(async () => undefined),
    sendVerificationEmail: vi.fn(async () => undefined),
    sessionError: null,
    status: 'authenticated',
    updateDisplayName: vi.fn(async () => undefined),
    user: authUser,
    ...overrides,
  }
}

function createLibraryValue(
  overrides: Partial<LibraryContextValue> = {},
): LibraryContextValue {
  return {
    clearAccountData: vi.fn(),
    getRecord: vi.fn(() => null),
    records: [],
    removeRecord: vi.fn(),
    retrySync: vi.fn(),
    syncError: null,
    syncStatus: 'synced',
    updateRecord: vi.fn(),
    ...overrides,
  }
}

function renderProfile() {
  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/login"
          element={<p>Returned to account access</p>}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('profile security controls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue(createAuthValue())
    vi.mocked(useLibrary).mockReturnValue(
      createLibraryValue(),
    )
  })

  it('sends a verification email and refreshes account state', async () => {
    const user = userEvent.setup()
    const sendVerificationEmail = vi.fn(
      async () => undefined,
    )
    const refreshUser = vi.fn(async () => undefined)
    vi.mocked(useAuth).mockReturnValue(
      createAuthValue({
        refreshUser,
        sendVerificationEmail,
      }),
    )
    renderProfile()

    await user.click(
      screen.getByRole('button', {
        name: 'Send verification email',
      }),
    )
    expect(sendVerificationEmail).toHaveBeenCalledOnce()
    expect(
      screen.getByText(/Verification email sent/),
    ).toBeVisible()

    await user.click(
      screen.getByRole('button', {
        name: 'Refresh verification status',
      }),
    )
    expect(refreshUser).toHaveBeenCalledOnce()
  })

  it('requires matching new passwords before changing the credential', async () => {
    const user = userEvent.setup()
    const changePassword = vi.fn(async () => undefined)
    vi.mocked(useAuth).mockReturnValue(
      createAuthValue({ changePassword }),
    )
    renderProfile()

    const passwordCard = screen
      .getByRole('heading', {
        name: 'Change the access key.',
      })
      .closest('article')

    expect(passwordCard).not.toBeNull()
    const controls = within(passwordCard!)

    await user.type(
      controls.getByLabelText('Current password'),
      'CurrentPass123!',
    )
    await user.type(
      controls.getByLabelText('New password'),
      'NewPassword123!',
    )
    await user.type(
      controls.getByLabelText('Confirm new password'),
      'NewPassword123!',
    )
    await user.click(
      controls.getByRole('button', {
        name: 'Change password',
      }),
    )

    expect(changePassword).toHaveBeenCalledWith(
      'CurrentPass123!',
      'NewPassword123!',
    )
    expect(
      controls.getByText('Your password was changed securely.'),
    ).toBeVisible()
  })

  it('exports the current account snapshot without a server request', async () => {
    const user = userEvent.setup()
    renderProfile()

    await user.click(
      screen.getByRole('button', {
        name: 'Download my CineScope data',
      }),
    )

    expect(downloadAccountExport).toHaveBeenCalledWith(
      expect.objectContaining({
        account: authUser,
        schemaVersion: 1,
      }),
    )
  })

  it('requires the typed phrase, deletes remotely, clears local data, and signs out', async () => {
    const user = userEvent.setup()
    const deleteAccount = vi.fn(async () => undefined)
    const logout = vi.fn(async () => undefined)
    const clearAccountData = vi.fn()
    vi.mocked(useAuth).mockReturnValue(
      createAuthValue({ deleteAccount, logout }),
    )
    vi.mocked(useLibrary).mockReturnValue(
      createLibraryValue({ clearAccountData }),
    )
    renderProfile()

    const dangerCard = screen
      .getByRole('heading', { name: 'Close the archive.' })
      .closest('article')

    expect(dangerCard).not.toBeNull()
    const controls = within(dangerCard!)
    const deleteButton = controls.getByRole('button', {
      name: 'Permanently delete my account',
    })

    expect(deleteButton).toBeDisabled()
    await user.type(
      controls.getByLabelText('Current password'),
      'CurrentPass123!',
    )
    await user.type(
      controls.getByLabelText(
        'Type DELETE MY ACCOUNT to confirm',
      ),
      'DELETE MY ACCOUNT',
    )
    await user.click(deleteButton)

    expect(deleteAccount).toHaveBeenCalledWith(
      'CurrentPass123!',
    )
    expect(clearAccountData).toHaveBeenCalledOnce()
    expect(logout).toHaveBeenCalledOnce()
    expect(
      screen.getByText('Returned to account access'),
    ).toBeVisible()
  })
})
