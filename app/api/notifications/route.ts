import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-middleware'
import { sendNotification } from '@/lib/notifications/channel-manager'
import { successResponse, errorResponse } from '@/lib/api-response'
import { handleError } from '@/lib/errors'
import { logger } from '@/lib/logger'

/**
 * GET /api/notifications
 * Get user's in-app notifications
 */
async function getNotifications(request: Request) {
  try {
    const session = await withAuth(request)
    if (!session) {
      return errorResponse('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const read = searchParams.get('read')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const where: any = {
      userId: session.user.id,
    }

    if (read !== null) {
      where.read = read === 'true'
    }

    const notifications = await prisma.inAppNotification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return successResponse(notifications)
  } catch (error) {
    logger.error('Error fetching notifications', error as Error)
    const errorInfo = handleError(error)
    return errorResponse(errorInfo.message, errorInfo.statusCode, errorInfo.code, errorInfo.details)
  }
}

/**
 * POST /api/notifications
 * Create and send a notification
 */
async function createNotification(request: Request) {
  try {
    const session = await withAuth(request)
    if (!session) {
      return errorResponse('Unauthorized', 401)
    }

    const body = await request.json()
    const { userId, channels, data } = body

    if (!userId || !channels || !data) {
      return errorResponse('Missing required fields', 400)
    }

    const result = await sendNotification(userId, channels, data)

    return successResponse(result)
  } catch (error) {
    logger.error('Error creating notification', error as Error)
    const errorInfo = handleError(error)
    return errorResponse(errorInfo.message, errorInfo.statusCode, errorInfo.code, errorInfo.details)
  }
}

export const GET = getNotifications
export const POST = createNotification

