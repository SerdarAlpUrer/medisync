import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const models = [
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
            'deviceMovement',
            'calibrationRecord',
            'maintenanceRecord',
            'workOrder',
            'device',
            'contract',
            'supplier',
            'location',
            'deviceCategory',
            'user',
            'hospital'
        ]

        await prisma.$transaction(async (tx) => {
            // SQLite: Foreign key constraint'leri geçici olarak devre dışı bırak
            await tx.$executeRawUnsafe('PRAGMA foreign_keys = OFF;')

            for (const model of models) {
                try {
                    // @ts-ignore
                    await tx[model].deleteMany()
                } catch (e) {
                    console.log(`Failed to clear ${model}, skipping.`)
                }
            }

            // SQLite: Foreign key constraint'leri tekrar aktif et
            await tx.$executeRawUnsafe('PRAGMA foreign_keys = ON;')
        })

        return NextResponse.json({ message: 'Sistem başarıyla sıfırlandı' })
    } catch (error) {
        console.error('Reset error:', error)
        return NextResponse.json(
            { error: 'Sıfırlama işlemi başarısız oldu' },
            { status: 500 }
        )
    }
}
