/**
 * Notification Channel Manager
 * Handles multiple notification channels: Email, SMS, Push, In-App
 */

import { sendEmail, emailTemplates } from '../email'
import { logger } from '../logger'

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in-app'
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface NotificationData {
  title: string
  message: string
  priority?: NotificationPriority
  category?: string
  actionUrl?: string
  metadata?: Record<string, any>
}

export interface NotificationPreferences {
  userId: string
  email: boolean
  sms: boolean
  push: boolean
  inApp: boolean
  categories?: Record<string, {
    email: boolean
    sms: boolean
    push: boolean
    inApp: boolean
  }>
}

/**
 * Send notification through multiple channels
 */
export async function sendNotification(
  userId: string,
  channels: NotificationChannel[],
  data: NotificationData,
  preferences?: NotificationPreferences
): Promise<{ success: boolean; results: Record<NotificationChannel, boolean> }> {
  const results: Record<NotificationChannel, boolean> = {
    email: false,
    sms: false,
    push: false,
    'in-app': false,
  }

  // Check preferences
  const enabledChannels = channels.filter((channel) => {
    if (!preferences) return true

    // Map channel name to preference key
    const prefKey = channel === 'in-app' ? 'inApp' : channel as keyof NotificationPreferences
    return (preferences as any)[prefKey] !== false
  })

  // Send through each enabled channel
  const promises = enabledChannels.map(async (channel) => {
    try {
      switch (channel) {
        case 'email':
          results.email = await sendEmailNotification(userId, data)
          break
        case 'sms':
          results.sms = await sendSMSNotification(userId, data)
          break
        case 'push':
          results.push = await sendPushNotification(userId, data)
          break
        case 'in-app':
          results['in-app'] = await sendInAppNotification(userId, data)
          break
      }
    } catch (error) {
      logger.error(`Failed to send ${channel} notification`, error as Error, { userId, data })
      results[channel] = false
    }
  })

  await Promise.allSettled(promises)

  const success = Object.values(results).some((result) => result === true)

  return { success, results }
}

/**
 * Send email notification
 */
async function sendEmailNotification(userId: string, data: NotificationData): Promise<boolean> {
  try {
    // Get user email from database (you'll need to implement this)
    // For now, using a placeholder
    const userEmail = process.env.NOTIFICATION_EMAIL || 'admin@example.com'

    const emailOptions = {
      to: userEmail,
      subject: data.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">${data.title}</h2>
          <p>${data.message}</p>
          ${data.actionUrl ? `<a href="${data.actionUrl}" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Detayları Görüntüle</a>` : ''}
        </div>
      `,
      text: `${data.title}\n\n${data.message}${data.actionUrl ? `\n\nDetaylar: ${data.actionUrl}` : ''}`,
    }

    return await sendEmail(emailOptions)
  } catch (error) {
    logger.error('Email notification failed', error as Error)
    return false
  }
}

/**
 * Send SMS notification
 */
async function sendSMSNotification(userId: string, data: NotificationData): Promise<boolean> {
  try {
    // Import SMS service dynamically
    const { sendSMS } = await import('./sms-service')
    return await sendSMS(userId, data.message)
  } catch (error) {
    logger.error('SMS notification failed', error as Error)
    return false
  }
}

/**
 * Send push notification
 */
async function sendPushNotification(userId: string, data: NotificationData): Promise<boolean> {
  try {
    // Import push service dynamically
    const { sendPush } = await import('./push-service')
    return await sendPush(userId, data)
  } catch (error) {
    logger.error('Push notification failed', error as Error)
    return false
  }
}

/**
 * Send in-app notification
 */
async function sendInAppNotification(userId: string, data: NotificationData): Promise<boolean> {
  try {
    // Store notification in database for in-app display
    const { prisma } = await import('../prisma')

    await prisma.inAppNotification.create({
      data: {
        userId,
        title: data.title,
        message: data.message,
        priority: data.priority || 'medium',
        category: data.category || null,
        actionUrl: data.actionUrl || null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        read: false,
      },
    })

    return true
  } catch (error) {
    logger.error('In-app notification failed', error as Error)
    return false
  }
}

/**
 * Get user notification preferences
 */
export async function getUserNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  try {
    const { prisma } = await import('../prisma')

    // Check if preferences exist in database
    // For now, return default preferences
    // You should create a NotificationPreference model in Prisma schema
    return {
      userId,
      email: true,
      sms: false,
      push: true,
      inApp: true,
    }
  } catch (error) {
    logger.error('Failed to get notification preferences', error as Error)
    return null
  }
}

