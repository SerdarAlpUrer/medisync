import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { testTelegramBot } from '@/lib/telegram'
import { testWhatsAppNotification } from '@/lib/whatsapp'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Bu işlem için yetki gereklidir' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { type, botToken, chatId, targetEmail, provider, apiUrl, token, phoneNumber } = body

    if (type === 'telegram') {
      const result = await testTelegramBot(botToken, chatId)
      return NextResponse.json(result)
    } else if (type === 'whatsapp') {
      const result = await testWhatsAppNotification(provider || 'ultramsg', apiUrl, token, phoneNumber)
      return NextResponse.json(result)
    } else if (type === 'email') {
      if (!targetEmail) {
        return NextResponse.json({ success: false, message: 'Hedef e-posta adresi belirtilmedi.' })
      }
      const sent = await sendEmail({
        to: targetEmail,
        subject: 'MediSync E-Posta Test Bildirimi',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px;">
            <h3 style="color: #2563eb; margin: 0 0 10px;">✅ MediSync E-Posta Testi Başarılı!</h3>
            <p>Tebrikler, e-posta bildirim sistemi yapılandırmanız çalışmaktadır.</p>
            <p style="font-size: 12px; color: #64748b;">Gönderim Zamanı: ${new Date().toLocaleString('tr-TR')}</p>
          </div>
        `
      })
      if (sent) {
        return NextResponse.json({ success: true, message: 'Test e-postası başarıyla gönderildi!' })
      } else {
        return NextResponse.json({ success: false, message: 'E-posta gönderilemedi. Lütfen SMTP ayarlarını kontrol edin.' })
      }
    }

    return NextResponse.json({ success: false, message: 'Geçersiz test türü' })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Test hatası' }, { status: 500 })
  }
}
