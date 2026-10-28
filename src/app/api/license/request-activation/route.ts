import { NextResponse } from 'next/server'
import { sendTelegramActivationRequest } from '@/lib/telegram'
import { LicenseManager } from '@/lib/license-manager'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const clientFingerprint = await LicenseManager.getDeviceFingerprint()
        const machineId = body.machineId || clientFingerprint

        const { hospitalName, contactName, contactPhone } = body

        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Yerel Ağ'

        const result = await sendTelegramActivationRequest({
            machineId,
            hospitalName,
            contactName,
            contactPhone,
            ipAddress: ip
        })

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'Aktivasyon talebiniz geliştiriciye Telegram üzerinden iletildi. Kod onaylanınca sisteme girebilirsiniz.'
            })
        } else {
            return NextResponse.json({
                success: false,
                message: result.error || 'Telegram bildirimi gönderilemedi'
            }, { status: 500 })
        }
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: 'Talep işlenirken bir hata oluştu: ' + (error?.message || String(error))
        }, { status: 500 })
    }
}
