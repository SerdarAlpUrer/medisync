import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-middleware'
import { subscribeToPush } from '@/lib/notifications/push-service'
import { successResponse, errorResponse } from '@/lib/api-response'
import { handleError } from '@/lib/errors'
import { logger } from '@/lib/logger'

/**
 * POST /api/notifications/push/subscribe
 * Subscribe user to push notifications
 */
async function subscribe(request: Request) {
  try {
    const session = await withAuth(request)
    if (!session) {
      return errorResponse('Unauthorized', 401)
    }

    const body = await request.json()
    const { subscription } = body

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return errorResponse('Invalid subscription data', 400)
    }

    // Store subscription in database
    await prisma.pushSubscription.upsert({
      where: {
        endpoint: subscription.endpoint,
      },
      create: {
        userId: session.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    })

    const result = await subscribeToPush(session.user.id, subscription)

    return successResponse({ success: result })
  } catch (error) {
    logger.error('Error subscribing to push', error as Error)
    const errorInfo = handleError(error)
    return errorResponse(errorInfo.message, errorInfo.statusCode, errorInfo.code, errorInfo.details)
  }
}

export const POST = subscribe

