import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-middleware'
import { successResponse, errorResponse } from '@/lib/api-response'
import { handleError } from '@/lib/errors'
import { logger } from '@/lib/logger'

/**
 * PATCH /api/notifications/[id]
 * Mark notification as read/unread
 */
async function updateNotification(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await withAuth(request)
    if (!session) {
      return errorResponse('Unauthorized', 401)
    }

    const body = await request.json()
    const { read } = body

    const notification = await prisma.inAppNotification.update({
      where: {
        id: id,
        userId: session.user.id, // Ensure user owns the notification
      },
      data: {
        read: read !== undefined ? read : true,
        readAt: read ? new Date() : null,
      },
    })

    return successResponse(notification)
  } catch (error) {
    logger.error('Error updating notification', error as Error)
    const errorInfo = handleError(error)
    return errorResponse(errorInfo.message, errorInfo.statusCode, errorInfo.code, errorInfo.details)
  }
}

/**
 * DELETE /api/notifications/[id]
 * Delete notification
 */
async function deleteNotification(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await withAuth(request)
    if (!session) {
      return errorResponse('Unauthorized', 401)
    }

    await prisma.inAppNotification.delete({
      where: {
        id: id,
        userId: session.user.id, // Ensure user owns the notification
      },
    })

    return successResponse({ success: true })
  } catch (error) {
    logger.error('Error deleting notification', error as Error)
    const errorInfo = handleError(error)
    return errorResponse(errorInfo.message, errorInfo.statusCode, errorInfo.code, errorInfo.details)
  }
}

export const PATCH = updateNotification
export const DELETE = deleteNotification

