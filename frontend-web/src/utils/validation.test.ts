import { describe, expect, it } from 'vitest'
import { isValidEmail, isValidPassword, validateLoginForm, validateSignupForm } from './validation'

describe('validation utils', () => {
  it('accepts valid email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
  })

  it('rejects malformed email addresses', () => {
    expect(isValidEmail('user.example.com')).toBe(false)
  })

  it('accepts strong passwords', () => {
    expect(isValidPassword('SenhaForte1!')).toBe(true)
  })

  it('rejects weak passwords', () => {
    expect(isValidPassword('12345678')).toBe(false)
  })

  it('validates login payloads', () => {
    const result = validateLoginForm({
      email: 'user@example.com',
      password: '123456',
    })

    expect(result.success).toBe(true)
  })

  it('returns signup validation errors for weak password', () => {
    const result = validateSignupForm({
      name: 'William',
      email: 'user@example.com',
      password: 'abc12345',
      companyName: 'Liquidly',
    })

    expect(result.success).toBe(false)
  })
})

