/**
 * Email Service
 * Handles email notifications for maintenance, calibration, and other events
 */

import { logger } from './logger'
import { getExtendedSettings } from '@/lib/extended-settings'

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

import nodemailer from 'nodemailer'

/**
 * Send email using Nodemailer and Stalwart SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Check if email is enabled
    const emailEnabled = process.env.EMAIL_ENABLED === 'true'
    if (!emailEnabled) {
      logger.debug('Email disabled, skipping send', { to: options.to })
      return true
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || '127.0.0.1',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false // Localhost self-signed certs match
      }
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'admin@medtechbiyomedikal.com.tr',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    logger.info('Email sent successfully', {
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

/**
 * Send Bug Report Email Notification
 */
export async function sendBugReportEmail(data: {
  reportId: string
  title: string
  description: string
  category: string
  severity: string
  pageUrl?: string | null
  userEmail?: string | null
  userName?: string | null
  hospitalName?: string | null
  technicalDetails?: string | null
}): Promise<boolean> {
  try {
    const settings = getExtendedSettings() as any
    const to = settings.supportAlertEmail || process.env.SUPPORT_EMAIL || 'admin@parkhayat.com'
    const isEnabled = settings.emailBugAlertsEnabled !== false

    if (!isEnabled) {
      logger.debug('Bug email alerts disabled in settings')
      return false
    }

    return await sendEmail({
      to,
      subject: `🚨 [Yazılım Hata Bildirimi] ${data.title} (${data.hospitalName || 'MediSync'})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: #1e3a8a; color: white; padding: 18px 24px;">
            <h2 style="margin: 0; font-size: 18px;">🚨 Yeni Yazılım Hata Bildirimi</h2>
            <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.85;">MediSync Klinik Bilgi Sistemi</p>
          </div>
          <div style="padding: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr><td style="padding: 6px 0; font-weight: bold; width: 140px; color: #475569;">Kurum:</td><td>${data.hospitalName || 'Belirtilmedi'}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold; color: #475569;">Bildiren:</td><td>${data.userName || '-'} (${data.userEmail || '-'})</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold; color: #475569;">Öncelik:</td><td><strong style="color: ${data.severity === 'CRITICAL' ? '#dc2626' : '#2563eb'};">${data.severity}</strong></td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold; color: #475569;">Sayfa / URL:</td><td><code>${data.pageUrl || '-'}</code></td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold; color: #475569;">Başlık:</td><td><strong>${data.title}</strong></td></tr>
            </table>
            <div style="margin-top: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
              <p style="margin: 0 0 6px; font-weight: bold; font-size: 12px; color: #334155;">Hata Açıklaması:</p>
              <p style="margin: 0; font-size: 13px; color: #0f172a; white-space: pre-wrap;">${data.description}</p>
            </div>
            ${data.technicalDetails ? `
            <div style="margin-top: 14px; background: #0f172a; border-radius: 8px; padding: 12px; color: #94a3b8; font-family: monospace; font-size: 11px;">
              ${data.technicalDetails}
            </div>` : ''}
            <div style="margin-top: 20px; font-size: 11px; color: #94a3b8; text-align: center;">
              Kayıt No: ${data.reportId} • ${new Date().toLocaleString('tr-TR')}
            </div>
          </div>
        </div>
      `,
      text: `Hata Bildirimi: ${data.title}\nKurum: ${data.hospitalName}\nBildiren: ${data.userName} (${data.userEmail})\nÖncelik: ${data.severity}\nSayfa: ${data.pageUrl}\n\nAçıklama:\n${data.description}`
    })
  } catch (error) {
    logger.error('Failed to send bug report email', error as Error)
    return false
  }
}

