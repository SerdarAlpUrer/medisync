/**
 * Password Policy and Validation
 * NIST 800-63B compliant password requirements
 */

import { z } from 'zod'

export const passwordPolicy = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfo: true,
}

// Common weak passwords to prevent
const COMMON_PASSWORDS = [
  'password', 'password123', '12345678', 'qwerty', 'abc123',
  'letmein', 'welcome', 'admin', '123456', 'password1',
  'Password1', 'Password123', 'Admin123', 'Welcome123'
]

/**
 * Validate password strength
 */
export function validatePassword(password: string, userInfo?: { email?: string; name?: string }): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < passwordPolicy.minLength) {
    errors.push(`Şifre en az ${passwordPolicy.minLength} karakter olmalıdır`)
  }

  if (password.length > passwordPolicy.maxLength) {
    errors.push(`Şifre en fazla ${passwordPolicy.maxLength} karakter olabilir`)
  }

  if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Şifre en az bir büyük harf içermelidir')
  }

  if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Şifre en az bir küçük harf içermelidir')
  }

  if (passwordPolicy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Şifre en az bir rakam içermelidir')
  }

  if (passwordPolicy.requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Şifre en az bir özel karakter içermelidir (!@#$%^&* vb.)')
  }

  // Check for common passwords
  if (passwordPolicy.preventCommonPasswords) {
    const lowerPassword = password.toLowerCase()
    if (COMMON_PASSWORDS.some(common => lowerPassword.includes(common.toLowerCase()))) {
      errors.push('Bu şifre çok yaygın kullanılıyor, lütfen daha güçlü bir şifre seçin')
    }
  }

  // Check if password contains user info
  if (passwordPolicy.preventUserInfo && userInfo) {
    const lowerPassword = password.toLowerCase()
    if (userInfo.email) {
      const emailParts = userInfo.email.toLowerCase().split('@')[0]
      if (lowerPassword.includes(emailParts) && emailParts.length > 3) {
        errors.push('Şifre email adresinizi içermemelidir')
      }
    }
    if (userInfo.name) {
      const nameParts = userInfo.name.toLowerCase().split(' ')
      for (const part of nameParts) {
        if (part.length > 3 && lowerPassword.includes(part)) {
          errors.push('Şifre adınızı içermemelidir')
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Zod schema for password validation
 */
export const passwordSchema = z
  .string()
  .min(passwordPolicy.minLength, `Şifre en az ${passwordPolicy.minLength} karakter olmalıdır`)
  .max(passwordPolicy.maxLength, `Şifre en fazla ${passwordPolicy.maxLength} karakter olabilir`)
  .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermelidir')
  .regex(/[a-z]/, 'Şifre en az bir küçük harf içermelidir')
  .regex(/[0-9]/, 'Şifre en az bir rakam içermelidir')
  .regex(/[^A-Za-z0-9]/, 'Şifre en az bir özel karakter içermelidir')
  .refine(
    (password) => {
      const lowerPassword = password.toLowerCase()
      return !COMMON_PASSWORDS.some(common => lowerPassword.includes(common.toLowerCase()))
    },
    {
      message: 'Bu şifre çok yaygın kullanılıyor, lütfen daha güçlü bir şifre seçin',
    }
  )

