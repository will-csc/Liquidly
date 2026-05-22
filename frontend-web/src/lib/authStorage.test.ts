import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearAuthSession,
  hasActiveSession,
  readSessionToken,
  readSessionUser,
  storeSessionAuth,
} from './authStorage'

describe('authStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it('stores auth data in session storage', () => {
    const ok = storeSessionAuth({ id: 1, email: 'user@example.com' }, 'token-123')

    expect(ok).toBe(true)
    expect(hasActiveSession()).toBe(true)
    expect(readSessionToken()).toBe('token-123')
    expect(readSessionUser<{ id: number }>()?.id).toBe(1)
  })

  it('clears auth state from storage', () => {
    storeSessionAuth({ id: 1 }, 'token-123')

    clearAuthSession()

    expect(hasActiveSession()).toBe(false)
    expect(readSessionUser()).toBeNull()
  })
})

