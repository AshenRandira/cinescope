// @vitest-environment jsdom

import '../../../test/setup-dom'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthContextValue } from '../context/AuthContext'
import {
  ACCOUNT_DELETION_NOTICE,
  storeAccountDeletionNotice,
} from '../data/auth'
import { useAuth } from '../hooks/useAuth'
import { LoginPage } from './LoginPage'
import { RegisterPage } from './RegisterPage'

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

function createAuthValue(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    changePassword: vi.fn(async () => undefined),
    deleteAccount: vi.fn(async () => undefined),
    getIdToken: vi.fn(async () => null),
    login: vi.fn(async () => undefined),
    logout: vi.fn(async () => undefined),
    register: vi.fn(async () => undefined),
    refreshUser: vi.fn(async () => undefined),
    resetPassword: vi.fn(async () => undefined),
    sendVerificationEmail: vi.fn(async () => undefined),
    sessionError: null,
    status: 'unauthenticated',
    updateDisplayName: vi.fn(async () => undefined),
    user: null,
    ...overrides,
  }
}

describe('authentication pages', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    vi.mocked(useAuth).mockReturnValue(createAuthValue())
  })

  it('normalizes an email and requests password-reset instructions', async () => {
    const user = userEvent.setup()
    const resetPassword = vi.fn(async () => undefined)
    vi.mocked(useAuth).mockReturnValue(createAuthValue({ resetPassword }))

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    await user.click(
      screen.getByRole('button', { name: 'Forgot your password?' }),
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Email address' }),
      '  MEMBER@EXAMPLE.COM  ',
    )
    await user.click(
      screen.getByRole('button', { name: /Send reset instructions/ }),
    )

    expect(resetPassword).toHaveBeenCalledWith('member@example.com')
    expect(
      screen.getByText(/Firebase will send password-reset instructions/),
    ).toBeVisible()
  })

  it('rejects mismatched registration passwords before calling Firebase', async () => {
    const user = userEvent.setup()
    const register = vi.fn(async () => undefined)
    vi.mocked(useAuth).mockReturnValue(createAuthValue({ register }))

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByRole('textbox', { name: 'Display name' }), 'Archive Member')
    await user.type(screen.getByRole('textbox', { name: 'Email address' }), 'member@example.com')
    await user.type(screen.getByLabelText('Password'), 'password-one')
    await user.type(screen.getByLabelText('Confirm password'), 'password-two')
    await user.click(
      screen.getByRole('button', { name: /Create CineScope account/ }),
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'The two passwords do not match.',
    )
    expect(register).not.toHaveBeenCalled()
  })

  it('shows a one-time confirmation after account deletion', () => {
    storeAccountDeletionNotice()

    const { unmount } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByText(ACCOUNT_DELETION_NOTICE),
    ).toBeVisible()
    unmount()

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(
      screen.queryByText(ACCOUNT_DELETION_NOTICE),
    ).not.toBeInTheDocument()
  })
})
