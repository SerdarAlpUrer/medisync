import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSystemAdmin } from '@/lib/system-admin'

export async function POST(request: Request) {
    // Only system ADMIN can reset the system
    const denied = await requireSystemAdmin('sistemi sıfırlayabilir')
    if (denied) return denied

    try {
        const models = [
            'trainingParticipant',
            'trainingDocument',
            'trainingSession',
            'deviceTraining',
            'trainingRecord',
            'unmatchedCalibration',
            'pushSubscription',
            'inAppNotification',
            'appSettings',
            'dataSubjectRequest',
            'adverseEvent',
            'cAPA',
            'electronicSignature',
            'auditLog',
            'deviceConsumable',
            'consumable',
            'deviceUptime',
            'deviceProcurement',
            'deviceDecommissioning',
            'deviceMovement',
            'calibrationRecord',
            'maintenanceRecord',
            'workOrder',
            'device',
            'contract',
            'supplier',
            'location',
            'deviceCategory'
        ]

        await prisma.$transaction(async (tx) => {
            for (const model of models) {
                try {
                    // @ts-ignore
                    if (tx[model]) {
                        // @ts-ignore
                        await tx[model].deleteMany()
                    }
                } catch (e) {
                    console.log(`Failed to clear ${model}, skipping.`)
                }
            }
        })

        return NextResponse.json({ message: 'Sistem verileri başarıyla sıfırlandı (kullanıcı ve hastane hesapları korundu)' })
    } catch (error) {
        console.error('Reset error:', error)
        return NextResponse.json(
            { error: 'Sıfırlama işlemi başarısız oldu' },
            { status: 500 }
        )
    }
}

