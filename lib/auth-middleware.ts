/**
 * Authentication and Authorization Middleware
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AuthenticationError, AuthorizationError } from './errors'
import { errorResponse } from './api-response'
import { logger } from './logger'

/**
 * Legacy withAuth helper for fetching session in Route Handlers
 */
export async function withAuth(req: Request) {
  return await getServerSession(authOptions)
}

export type UserRole = 'ADMIN' | 'TECHNICIAN' | 'ENGINEER' | 'USER' | 'VIEWER'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  role: UserRole
  hospitalId?: string | null
}

/**
 * Check if user can modify data (VIEWER cannot)
 */
export function canModify(userRole: UserRole): boolean {
  return userRole !== 'VIEWER'
}

/**
 * Get authenticated user from session
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser> {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    throw new AuthenticationError('Oturum açmanız gerekiyor')
  }

  return {
    id: session.user.id || '',
    email: session.user.email || '',
    name: session.user.name || '',
    role: (session.user.role as UserRole) || 'USER',
    hospitalId: session.user.hospitalId || null,
  }
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole)
}

/**
 * Require authentication middleware
 */
export function requireAuth(
  handler: (req: Request, user: AuthenticatedUser) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    try {
      const user = await getAuthenticatedUser()
      return await handler(req, user)
    } catch (error) {
      logger.error('Authentication failed', error as Error, { path: req.url })
      if (error instanceof AuthenticationError) {
        return errorResponse(error.message, error.statusCode, error.code)
      }
      return errorResponse('Authentication failed', 401)
    }
  }
}

/**
 * Require specific role(s) middleware
 */
export function requireRole(
  roles: UserRole[],
  handler: (req: Request, user: AuthenticatedUser) => Promise<Response>
) {
  return requireAuth(async (req, user) => {
    if (!hasRole(user.role, roles)) {
      logger.warn('Authorization failed', {
        userId: user.id,
        userRole: user.role,
        requiredRoles: roles,
        path: req.url,
      })
      throw new AuthorizationError('Bu işlem için yetkiniz yok')
    }
    return await handler(req, user)
  })
}

/**
 * Require admin role
 */
export function requireAdmin(
  handler: (req: Request, user: AuthenticatedUser) => Promise<Response>
) {
  return requireRole(['ADMIN'], handler)
}

/**
 * Require write access (blocks VIEWER role)
 */
export function requireWriteAccess(
  handler: (req: Request, user: AuthenticatedUser) => Promise<Response>
) {
  return requireAuth(async (req, user) => {
    if (!canModify(user.role)) {
      logger.warn('Write access denied for VIEWER', {
        userId: user.id,
        userRole: user.role,
        path: req.url,
      })
      throw new AuthorizationError('Görüntüleme hesabıyla değişiklik yapamazsınız')
    }
    return await handler(req, user)
  })
}
