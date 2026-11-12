import { getExtendedSettings } from '@/src/lib/extended-settings'
import { logger } from './logger'

export interface WhatsAppFaultAlertPayload {
  workOrderNumber?: string
  deviceId?: string
  deviceName: string
  deviceTag?: string
  brandModel?: string
  hospitalName?: string
  departmentLocation?: string
  reporterName?: string
  reporterPhone?: string
  reporterTitle?: string
  priority?: string
  description: string
  scheduledDate?: Date | string
}

function getWhatsAppCredentials() {
  const settings = getExtendedSettings() as any
  const isEnabled = settings.whatsappAlertsEnabled === true
  const provider = settings.whatsappProvider || 'ultramsg'
  const apiUrl = settings.whatsappApiUrl || ''
  const token = settings.whatsappToken || ''
  const phoneNumber = settings.whatsappPhoneNumber || ''

  return { isEnabled, provider, apiUrl, token, phoneNumber }
}

/**
 * Format message for WhatsApp (with WhatsApp Markdown)
 */
export function formatWhatsAppFaultMessage(payload: WhatsAppFaultAlertPayload): string {
  const priorityEmojis: Record<string, string> = {
    URGENT: '🚨 *[ACİL / KRİTİK]*',
    HIGH: '🔴 *[YÜKSEK ÖNCELİK]*',
    MEDIUM: '🟡 *[NORMAL]*',
    LOW: '🟢 *[DÜŞÜK]*'
  }

  const priorityText = priorityEmojis[payload.priority || 'MEDIUM'] || '🟡 *[NORMAL]*'
  const now = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })

  return `
*🔧 YENİ CİHAZ ARIZA / BAKIM BİLDİRİMİ!*
━━━━━━━━━━━━━━━━━━━━━
🏥 *Hastane:* ${payload.hospitalName || 'Belirtilmedi'}
🏷️ *Künye No:* ${payload.deviceTag || 'TANIMSIZ'}
⚙️ *Cihaz:* *${payload.deviceName}* ${payload.brandModel ? `(${payload.brandModel})` : ''}
📍 *Konum:* ${payload.departmentLocation || 'Belirtilmedi'}

👤 *Bildiren:* ${payload.reporterName || 'Personel'} ${payload.reporterTitle ? `(${payload.reporterTitle})` : ''}
📞 *İletişim:* ${payload.reporterPhone || 'Yok'}
⚡ *Öncelik:* ${priorityText}

📝 *Arıza Açıklaması:*
${payload.description}

${payload.workOrderNumber ? `🆔 *İş Emri / Takip No:* ${payload.workOrderNumber}\n` : ''}⏱️ *Tarih:* ${now}
━━━━━━━━━━━━━━━━━━━━━
_MediSync Biyomedikal Yönetim Sistemi_
`.trim()
}

/**
 * Send WhatsApp Fault Notification to Biomedical Engineers & Technicians
 */
export async function sendWhatsAppFaultAlert(payload: WhatsAppFaultAlertPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const { isEnabled, provider, apiUrl, token, phoneNumber } = getWhatsAppCredentials()

    if (!isEnabled || !phoneNumber || (!apiUrl && !token)) {
      logger.info('WhatsApp arıza bildirimi yapılandırılmamış veya kapalı, atlanıyor')
      return { success: true }
    }

    const messageText = formatWhatsAppFaultMessage(payload)
    return await executeWhatsAppSend(provider, apiUrl, token, phoneNumber, messageText)
  } catch (error: any) {
    logger.error('WhatsApp arıza bildirimi gönderme hatası:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Test WhatsApp Notification Connection
 */
export async function testWhatsAppNotification(
  provider: string,
  apiUrl: string,
  token: string,
  phoneNumber: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!phoneNumber) {
      return { success: false, message: 'Hedef WhatsApp telefon numarası boş olamaz.' }
    }

    const testMessage = `
*✅ MediSync WhatsApp Bildirim Testi*
━━━━━━━━━━━━━━━━━━━━━
Tebrikler! Biyomedikal arıza ve iş emri WhatsApp entegrasyonu başarıyla kuruldu.
⏱️ Zaman: ${new Date().toLocaleString('tr-TR')}
━━━━━━━━━━━━━━━━━━━━━
_MediSync Biyomedikal Sistemleri_
`.trim()

    const result = await executeWhatsAppSend(provider, apiUrl, token, phoneNumber, testMessage)
    if (result.success) {
      return { success: true, message: 'WhatsApp test mesajı başarıyla iletildi!' }
    } else {
      return { success: false, message: result.error || 'WhatsApp mesajı gönderilemedi.' }
    }
  } catch (error: any) {
    return { success: false, message: 'Bağlantı hatası: ' + error.message }
  }
}

/**
 * Direct WhatsApp HTTP Send Dispatcher
 */
async function executeWhatsAppSend(
  provider: string,
  apiUrl: string,
  token: string,
  toPhone: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  const cleanPhone = toPhone.trim().replace(/[^0-9@c.usg.us]/g, '')

  // 1. UltraMsg Provider
  if (provider === 'ultramsg') {
    // apiUrl usually: https://api.ultramsg.com/{instance_id}/messages/chat
    const targetUrl = apiUrl || `https://api.ultramsg.com/${token}/messages/chat`
    const body = new URLSearchParams()
    body.append('token', token)
    body.append('to', cleanPhone)
    body.append('body', text)

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    })

    const data = await response.json()
    if (data.sent === 'true' || data.sent === true || data.id) {
      return { success: true }
    }
    return { success: false, error: data.message || data.error || 'UltraMsg gönderim hatası' }
  }

  // 2. Green API Provider
  if (provider === 'greenapi') {
    const formattedChatId = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@c.us`
    const targetUrl = apiUrl.replace(/\/$/, '') + '/sendMessage/' + token

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: formattedChatId,
        message: text
      })
    })

    const data = await response.json()
    if (data.idMessage) {
      return { success: true }
    }
    return { success: false, error: data.message || 'Green API gönderim hatası' }
  }

  // 3. Generic Webhook / Custom API
  if (provider === 'generic_webhook' || apiUrl) {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        to: cleanPhone,
        message: text,
        timestamp: new Date().toISOString()
      })
    })

    if (response.ok) {
      return { success: true }
    }
    return { success: false, error: `Webhook sunucu hatası (HTTP ${response.status})` }
  }

  return { success: false, error: 'Bilinmeyen WhatsApp sağlayıcısı veya eksik API URL.' }
}

/**
 * Generate a 1-click WhatsApp Click-to-Chat link
 */
export function getWhatsAppClickToChatUrl(phoneNumber: string, message: string): string {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '')
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}
