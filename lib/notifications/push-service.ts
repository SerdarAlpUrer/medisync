/**
 * Push Notification Service
 * Uses Web Push API for browser push notifications
 */

import { logger } from '../logger'
import { NotificationData } from './channel-manager'

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * Send push notification
 */
export async function sendPush(userId: string, data: NotificationData): Promise<boolean> {
  try {
    const pushEnabled = process.env.PUSH_ENABLED === 'true'
    if (!pushEnabled) {
      logger.debug('Push notifications disabled, skipping send', { userId })
      return true
    }

    // Get user's push subscriptions from database
    const { prisma } = await import('../prisma')

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    })

    if (subscriptions.length === 0) {
      logger.debug('No push subscriptions found for user', { userId })
      return false
    }

    // Send push to all user's subscriptions
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        sendPushToSubscription(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          data
        )
      )
    )

    const success = results.some((result) => result.status === 'fulfilled' && result.value === true)
    return success

    // For now, simulate push notification
    logger.info('Push notification sent (simulated)', {
      userId,
      title: data.title,
    })

    return true
  } catch (error) {
    logger.error('Failed to send push notification', error as Error, { userId })
    return false
  }
}

/**
 * Send push notification to specific subscription
 */
export async function sendPushToSubscription(
  subscription: PushSubscription,
  data: NotificationData
): Promise<boolean> {
  try {
    const webpush = await import('web-push')

    const publicKey = process.env.VAPID_PUBLIC_KEY
    const privateKey = process.env.VAPID_PRIVATE_KEY

    if (!publicKey || !privateKey) {
      logger.warn('VAPID keys not configured')
      return false
    }

    webpush.setVapidDetails('mailto:admin@medisync.com', publicKey, privateKey)

    const payload = JSON.stringify({
      title: data.title,
      body: data.message,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: {
        url: data.actionUrl || '/dashboard',
        ...data.metadata,
      },
    })

    await webpush.sendNotification(subscription, payload)

    return true
  } catch (error) {
    logger.error('Push notification to subscription failed', error as Error)
    return false
  }
}

/**
 * Subscribe user to push notifications
 */
export async function subscribeToPush(userId: string, subscription: PushSubscription): Promise<boolean> {
  try {
    const { prisma } = await import('../prisma')

    // Store subscription in database
    await prisma.pushSubscription.upsert({
      where: {
        endpoint: subscription.endpoint,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    })

    logger.info('Push subscription created', { userId })
    return true
  } catch (error) {
    logger.error('Failed to subscribe to push', error as Error)
    return false
  }
}

