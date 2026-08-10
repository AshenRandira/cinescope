// @vitest-environment jsdom

import '../../../test/setup-dom'

import { render, screen } from '@testing-library/react'
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
} from '../context/AuthContext'
import { RequireAuth } from './RequireAuth'

function createAuthValue(status: AuthStatus): AuthContextValue {
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
    status,
    updateDisplayName: vi.fn(async () => undefined),
    user: null,
  }
}

function LoginProbe() {
  const location = useLocation()

  return <output>Login from {String(location.state?.from)}</output>
}

function renderProtectedRoute(status: AuthStatus) {
  return render(
    <AuthContext.Provider value={createAuthValue(status)}>
      <MemoryRouter initialEntries={['/profile?panel=identity']}>
        <Routes>
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <h1>Member profile</h1>
              </RequireAuth>
            }
          />
          <Route path="/login" element={<LoginProbe />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('RequireAuth', () => {
  it('renders the protected route for an authenticated member', () => {
    renderProtectedRoute('authenticated')

    expect(
      screen.getByRole('heading', { name: 'Member profile' }),
    ).toBeVisible()
  })

  it('preserves the requested URL when redirecting a signed-out visitor', () => {
    renderProtectedRoute('unauthenticated')

    expect(screen.getByText('Login from /profile?panel=identity')).toBeVisible()
  })

  it('shows a restoration state while Firebase initializes', () => {
    renderProtectedRoute('initializing')

    expect(
      screen.getByText('Restoring your archive session'),
    ).toBeVisible()
  })
})
