import { createContext } from 'react'

export type AuthStatus =
  | 'unconfigured'
  | 'initializing'
  | 'authenticated'
  | 'unauthenticated'

export type AuthUser = {
  createdAt: string | null
  displayName: string | null
  email: string | null
  emailVerified: boolean
  lastSignInAt: string | null
  uid: string
}

export type RegisterCredentials = {
  displayName: string
  email: string
  password: string
}

export type AuthContextValue = {
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>
  deleteAccount: (
    currentPassword: string,
  ) => Promise<void>
  getIdToken: (
    forceRefresh?: boolean,
  ) => Promise<string | null>
  login: (
    email: string,
    password: string,
  ) => Promise<void>
  logout: () => Promise<void>
  register: (
    credentials: RegisterCredentials,
  ) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  refreshUser: () => Promise<void>
  sendVerificationEmail: () => Promise<void>
  sessionError: string | null
  status: AuthStatus
  updateDisplayName: (
    displayName: string,
  ) => Promise<void>
  user: AuthUser | null
}

export const AuthContext =
  createContext<AuthContextValue | null>(null)
