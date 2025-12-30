/**
 * Account Lockout Management
 * Prevents brute force attacks by locking accounts after failed attempts
 */

import { prisma } from './prisma'
import { logger } from './logger'

export const LOCKOUT_CONFIG = {
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 30 * 60 * 1000, // 30 minutes
}

/**
 * Check if account is locked
 */
export async function isAccountLocked(userId: string): Promise<{
  locked: boolean
  unlockTime?: Date
  remainingAttempts?: number
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      failedLoginAttempts: true,
      updatedAt: true,
    },
  })

  if (!user) {
    return { locked: false }
  }

  // Check if lockout period has passed
  if (user.failedLoginAttempts >= LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS) {
    const lockoutStartTime = user.updatedAt.getTime()
    const now = Date.now()
    const timeSinceLockout = now - lockoutStartTime

    if (timeSinceLockout < LOCKOUT_CONFIG.LOCKOUT_DURATION_MS) {
      const unlockTime = new Date(lockoutStartTime + LOCKOUT_CONFIG.LOCKOUT_DURATION_MS)
      const remainingMinutes = Math.ceil(
        (LOCKOUT_CONFIG.LOCKOUT_DURATION_MS - timeSinceLockout) / 60000
      )
      return {
        locked: true,
        unlockTime,
      }
    } else {
      // Lockout period passed, reset attempts
      await prisma.user.update({
        where: { id: userId },
        data: { failedLoginAttempts: 0 },
      })
      return { locked: false }
    }
  }

  const remainingAttempts = LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS - user.failedLoginAttempts
  return {
    locked: false,
    remainingAttempts: remainingAttempts > 0 ? remainingAttempts : 0,
  }
}

/**
 * Increment failed login attempts
 */
export async function incrementFailedAttempts(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { failedLoginAttempts: true },
  })

  if (!user) return

  const newAttempts = user.failedLoginAttempts + 1

  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: newAttempts },
  })

  if (newAttempts >= LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS) {
    logger.warn('Account locked due to too many failed attempts', {
      userId,
      attempts: newAttempts,
    })
  } else {
    logger.warn('Failed login attempt', {
      userId,
      attempts: newAttempts,
      remaining: LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS - newAttempts,
    })
  }
}

/**
 * Reset failed login attempts (on successful login)
 */
export async function resetFailedAttempts(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0 },
  })
}

