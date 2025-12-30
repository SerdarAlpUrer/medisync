/**
 * Email Service
 * Handles email notifications for maintenance, calibration, and other events
 */

import { logger } from './logger'

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export interface EmailTemplate {
  maintenanceReminder: (data: {
    deviceName: string
    tagNumber: string
    dueDate: string
    location: string
  }) => EmailOptions
  calibrationReminder: (data: {
    deviceName: string
    tagNumber: string
    dueDate: string
    location: string
  }) => EmailOptions
  workOrderCreated: (data: {
    workOrderNumber: string
    deviceName: string
    description: string
    priority: string
  }) => EmailOptions
}

/**
 * Send email (placeholder - integrate with your email service)
 * For production, integrate with services like:
 * - SendGrid
 * - AWS SES
 * - Nodemailer with SMTP
 * - Resend
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Check if email is enabled
    const emailEnabled = process.env.EMAIL_ENABLED === 'true'
    if (!emailEnabled) {
      logger.debug('Email disabled, skipping send', { to: options.to })
      return true // Return true to not break flow
    }

    // TODO: Integrate with actual email service
    // Example with Nodemailer:
    // const transporter = nodemailer.createTransport({...})
    // await transporter.sendMail({...})

    logger.info('Email sent (simulated)', {
      to: options.to,
      subject: options.subject,
    })

    return true
  } catch (error) {
    logger.error('Failed to send email', error as Error, {
      to: options.to,
      subject: options.subject,
    })
    return false
  }
}

/**
 * Email templates
 */
export const emailTemplates: EmailTemplate = {
  maintenanceReminder: (data) => ({
    to: process.env.MAINTENANCE_EMAIL || 'admin@example.com',
    subject: `Bakım Hatırlatıcı: ${data.deviceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Bakım Hatırlatıcı</h2>
        <p>Aşağıdaki cihaz için bakım tarihi yaklaşıyor:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; background: #f3f4f6; font-weight: bold;">Cihaz Adı:</td>
            <td style="padding: 8px;">${data.deviceName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background: #f3f4f6; font-weight: bold;">Künye No:</td>
            <td style="padding: 8px;">${data.tagNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background: #f3f4f6; font-weight: bold;">Lokasyon:</td>
            <td style="padding: 8px;">${data.location}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background: #f3f4f6; font-weight: bold;">Bakım Tarihi:</td>
            <td style="padding: 8px; color: #dc2626; font-weight: bold;">${data.dueDate}</td>
          </tr>
        </table>
        <p style="margin-top: 20px;">Lütfen bakım işlemini planlayın.</p>
      </div>
    `,
    text: `Bakım Hatırlatıcı: ${data.deviceName} (${data.tagNumber}) - Bakım Tarihi: ${data.dueDate} - Lokasyon: ${data.location}`,
  }),

  calibrationReminder: (data) => ({
    to: process.env.CALIBRATION_EMAIL || 'admin@example.com',
    subject: `Kalibrasyon Hatırlatıcı: ${data.deviceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Kalibrasyon Hatırlatıcı</h2>
        <p>Aşağıdaki cihaz için kalibrasyon tarihi yaklaşıyor:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; background: #f3f4f6; font-weight: bold;">Cihaz Adı:</td>
            <td style="padding: 8px;">${data.deviceName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background: #f3f4f6; font-weight: bold;">Künye No:</td>
            <td style="padding: 8px;">${data.tagNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background: #f3f4f6; font-weight: bold;">Lokasyon:</td>
            <td style="padding: 8px;">${data.location}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background: #f3f4f6; font-weight: bold;">Kalibrasyon Tarihi:</td>
            <td style="padding: 8px; color: #dc2626; font-weight: bold;">${data.dueDate}</td>
          </tr>
        </table>
        <p style="margin-top: 20px;">Lütfen kalibrasyon işlemini planlayın.</p>
      </div>
    `,
    text: `Kalibrasyon Hatırlatıcı: ${data.deviceName} (${data.tagNumber}) - Kalibrasyon Tarihi: ${data.dueDate} - Lokasyon: ${data.location}`,
  }),

  workOrderCreated: (data) => ({
    to: process.env.WORKORDER_EMAIL || 'admin@example.com',
    subject: `Yeni İş Emri: ${data.workOrderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Yeni İş Emri Oluşturuldu</h2>
        <p>Yeni bir iş emri oluşturuldu:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; background: #f3f4f6; font-weight: bold;">İş Emri No:</td>
            <td style="padding: 8px;">${data.workOrderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background: #f3f4f6; font-weight: bold;">Cihaz:</td>
            <td style="padding: 8px;">${data.deviceName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background: #f3f4f6; font-weight: bold;">Öncelik:</td>
            <td style="padding: 8px;">${data.priority}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background: #f3f4f6; font-weight: bold;">Açıklama:</td>
            <td style="padding: 8px;">${data.description}</td>
          </tr>
        </table>
      </div>
    `,
    text: `Yeni İş Emri: ${data.workOrderNumber} - Cihaz: ${data.deviceName} - Öncelik: ${data.priority}`,
  }),
}

