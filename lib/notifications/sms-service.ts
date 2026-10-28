/**
 * SMS Notification Service
 * Supports Twilio and other SMS providers
 */

import { logger } from '../logger'

export interface SMSOptions {
  to: string
  message: string
  from?: string
}

/**
 * Send SMS notification
 */
export async function sendSMS(userId: string, message: string): Promise<boolean> {
  try {
    const smsEnabled = process.env.SMS_ENABLED === 'true'
    if (!smsEnabled) {
      logger.debug('SMS disabled, skipping send', { userId })
      return true // Return true to not break flow
    }

    // Get user phone number from database
    const { prisma } = await import('../prisma')
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    })

    if (!user?.phone) {
      logger.warn('User phone number not found', { userId })
      return false
    }

    const provider = process.env.SMS_PROVIDER || 'twilio'

    switch (provider) {
      case 'twilio':
        return await sendViaTwilio({
          to: user.phone,
          message,
        })
      default:
        logger.warn('Unknown SMS provider', { provider })
        return false
    }
  } catch (error) {
    logger.error('Failed to send SMS', error as Error, { userId })
    return false
  }
}

/**
 * Send SMS via Twilio
 */
async function sendViaTwilio(options: SMSOptions): Promise<boolean> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER || options.from

    if (!accountSid || !authToken || !fromNumber) {
      logger.warn('Twilio credentials not configured')
      return false
    }

    // In production, use Twilio SDK
    // const client = require('twilio')(accountSid, authToken)
    // const message = await client.messages.create({
    //   body: options.message,
    //   from: fromNumber,
    //   to: options.to,
    // })

    // For now, simulate SMS sending
    logger.info('SMS sent (simulated)', {
      to: options.to,
      message: options.message.substring(0, 50),
    })

    return true
  } catch (error) {
    logger.error('Twilio SMS failed', error as Error)
    return false
  }
}

/**
 * Send bulk SMS
 */
export async function sendBulkSMS(userIds: string[], message: string): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  for (const userId of userIds) {
    const result = await sendSMS(userId, message)
    if (result) {
      success++
    } else {
      failed++
    }
  }

  return { success, failed }
}

