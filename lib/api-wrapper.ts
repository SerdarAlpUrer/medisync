/**
 * API Wrapper - Standardized API route handler
 * Provides consistent error handling, logging, and response formatting
 */

import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from './rate-limit'
import { requireAuth, AuthenticatedUser } from './auth-middleware'
import { successResponse, errorResponse } from './api-response'
import { handleError } from './errors'
import { logger } from './logger'
import { createAuditLog } from './audit'

export interface ApiHandlerOptions {
  requireAuth?: boolean
  requireRole?: string[]
  rateLimit?: {
    maxRequests?: number
    windowMs?: number
  }
  auditLog?: {
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT'
    entity: string
  }
}

export type ApiHandler<T = any> = (
  req: NextRequest,
  user?: AuthenticatedUser
) => Promise<NextResponse<{ success: boolean; data?: T; error?: any }>>

/**
 * Wraps an API handler with standard middleware
 */
export function apiWrapper<T = any>(
  handler: ApiHandler<T>,
  options: ApiHandlerOptions = {}
) {
  let wrappedHandler = handler

  // Add authentication if required
  if (options.requireAuth) {
    if (options.requireRole) {
      const { requireRole } = require('./auth-middleware')
      wrappedHandler = requireRole(
        options.requireRole as any,
        wrappedHandler as any
      ) as any
    } else {
      wrappedHandler = requireAuth(wrappedHandler as any) as any
    }
  }

  // Add rate limiting
  const rateLimitOptions = options.rateLimit || {}
  wrappedHandler = withRateLimit(wrappedHandler as any, rateLimitOptions) as any

  return wrappedHandler
}

/**
 * Creates an audit log entry for API operations
 */
export async function logApiOperation(
  req: NextRequest,
  user: AuthenticatedUser | undefined,
  options: {
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT'
    entity: string
    entityId?: string
    beforeValue?: any
    afterValue?: any
  }
) {
  if (!user) return

  try {
    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: options.action,
      entity: options.entity,
      entityId: options.entityId,
      beforeValue: options.beforeValue,
      afterValue: options.afterValue,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })
  } catch (error) {
    logger.warn('Failed to create audit log', { error, options })
  }
}

