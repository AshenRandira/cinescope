import { describe, expect, it } from 'vitest'

import {
  getAuthErrorMessage,
  getAuthRedirectTarget,
  normalizeAuthEmail,
} from './auth'

describe('authentication helpers', () => {
  it('normalizes account email addresses', () => {
    expect(normalizeAuthEmail('  MEMBER@EXAMPLE.COM ')).toBe(
      'member@example.com',
    )
  })

  it('maps known and unknown Firebase failures to safe copy', () => {
    expect(
      getAuthErrorMessage({ code: 'auth/invalid-credential' }),
    ).toContain('could not be verified')
    expect(getAuthErrorMessage({ code: 'auth/unknown' })).toContain(
      'could not complete',
    )
    expect(getAuthErrorMessage(new Error('Offline fixture'))).toBe(
      'Offline fixture',
    )
    expect(getAuthErrorMessage(null)).toContain('could not be completed')
  })

  it('accepts internal redirects and rejects external-looking targets', () => {
    expect(getAuthRedirectTarget({ from: '/profile?tab=identity' })).toBe(
      '/profile?tab=identity',
    )
    expect(getAuthRedirectTarget({ from: '//example.com' })).toBe('/profile')
    expect(getAuthRedirectTarget({ from: 'https://example.com' })).toBe(
      '/profile',
    )
    expect(getAuthRedirectTarget(undefined)).toBe('/profile')
  })
})
