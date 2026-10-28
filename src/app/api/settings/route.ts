import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getExtendedSettings, saveExtendedSettings, ExtendedSystemSettings } from '@/lib/extended-settings'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const SUPERVISOR_ONLY_MODULES = [
    'procurementEnabled',
    'decommissioningEnabled',
    'utsEnabled',
    'complianceEnabled',
    'trainingEnabled'
]

const PRISMA_FIELDS = [
    'maintenanceEnabled', 'calibrationEnabled', 'contractsEnabled',
    'utsEnabled', 'complianceEnabled', 'reportsEnabled',
    'branchesEnabled', 'trainingEnabled', 'procurementEnabled',
    'decommissioningEnabled', 'backupAuto', 'backupSchedule',
    'backupRetention', 'deviceTagFormat'
]

const EXTENDED_FIELDS: (keyof ExtendedSystemSettings)[] = [
    'labelHeaderText', 'defaultLabelFormat', 'showSerialOnLabel',
    'showLocationOnLabel', 'calibrationAlertDays', 'maintenanceAlertDays',
    'warrantyAlertDays', 'defaultMaintenanceInterval', 'defaultCalibrationInterval',
    'criticalSlaHours', 'itemsPerPage', 'fontSize', 'sidebarWidth',
    'emergencyPhone', 'reportHeaderTitle',
    'telegramBugAlertsEnabled', 'telegramBotToken', 'telegramChatId',
    'emailBugAlertsEnabled', 'supportAlertEmail',
    'faultTelegramAlertsEnabled', 'faultTelegramBotToken', 'faultTelegramChatId',
    'whatsappAlertsEnabled', 'whatsappProvider', 'whatsappApiUrl', 'whatsappToken', 'whatsappPhoneNumber'
]

export async function GET() {
    try {
        let settings = await prisma.appSettings.findUnique({
            where: { id: "default" }
        })

        if (!settings) {
            settings = await prisma.appSettings.create({
                data: {
                    id: "default",
                }
            })
        }

        // Fallback: If deviceTagFormat is missing (old client), fetch it via raw SQL
        // @ts-ignore
        if (settings && settings.deviceTagFormat === undefined) {
            try {
                const rawResult = await prisma.$queryRaw<Array<{ deviceTagFormat: string }>>`SELECT "deviceTagFormat" FROM "app_settings" WHERE id = 'default'`
                if (rawResult.length > 0 && rawResult[0].deviceTagFormat) {
                    // @ts-ignore
                    settings.deviceTagFormat = rawResult[0].deviceTagFormat
                } else {
                    // @ts-ignore
                    settings.deviceTagFormat = "KUNYE-{YYYY}-{SEQ}"
                }
            } catch (rawError) {
                console.warn("Raw query failed:", rawError)
            }
        }

        const extended = getExtendedSettings()

        // Bot Token ve Chat ID'yi environment ve kalıcı ayarlarla senkronize et
        const botToken = process.env.TELEGRAM_BOT_TOKEN || extended.telegramBotToken || '8295345493:AAEP8VLR9BU6b8xxsa0x3NeAlLLVR_vzJ8c'
        const chatId = process.env.TELEGRAM_CHAT_ID || extended.telegramChatId || '1539699467'

        const session = await getServerSession(authOptions)
        const isAdmin = (session?.user as any)?.role === 'ADMIN'

        // Admin dışındaki kullanıcılar için bot token'ı maskele
        const maskedToken = (!isAdmin && botToken && botToken.includes(':'))
            ? botToken.split(':')[0] + ':••••••••••••••••••••••••••••••'
            : botToken

        return NextResponse.json({
            ...extended,
            telegramBotToken: maskedToken,
            telegramChatId: chatId,
            ...settings,
        })
    } catch (error) {
        console.error("Error fetching settings:", error)
        return NextResponse.json({ error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json()

        const session = await getServerSession(authOptions)
        const user = session?.user as any
        const isSupervisor = user?.role === 'ADMIN' && (!user.hospitalId || user.email === 'admin@biomedicapp.com' || user.email === 'supervisor@medisync.com')

        // Lisans kısıtlamaları açık kaynak için kaldırıldı - tüm modüller serbestçe açılabilir

        // 1. Update Prisma fields if any are provided
        const updateData: Partial<Prisma.AppSettingsCreateInput> = {}
        let hasPrismaUpdate = false

        for (const field of PRISMA_FIELDS) {
            if (body[field] !== undefined) {
                updateData[field as keyof Prisma.AppSettingsCreateInput] = body[field]
                hasPrismaUpdate = true
            }
        }

        let settings = await prisma.appSettings.findUnique({ where: { id: "default" } })

        if (hasPrismaUpdate || !settings) {
            try {
                settings = await prisma.appSettings.upsert({
                    where: { id: "default" },
                    update: updateData,
                    create: {
                        id: "default",
                        ...updateData
                    }
                })
            } catch (primaError: unknown) {
                const error = primaError as Error & { code?: string }
                if (error.message?.includes('Unknown argument') && (updateData as any).deviceTagFormat) {
                    const { deviceTagFormat, ...safeUpdateData } = updateData as any
                    settings = await prisma.appSettings.upsert({
                        where: { id: "default" },
                        update: safeUpdateData,
                        create: {
                            id: "default",
                            ...safeUpdateData
                        }
                    })
                    await prisma.$executeRawUnsafe('UPDATE "app_settings" SET "deviceTagFormat" = $1 WHERE id = \'default\'', deviceTagFormat)
                    // @ts-ignore
                    settings.deviceTagFormat = deviceTagFormat
                } else {
                    throw error
                }
            }
        }

        // 2. Update Extended fields if any are provided
        const extendedUpdate: Partial<ExtendedSystemSettings> = {}
        let hasExtendedUpdate = false

        for (const field of EXTENDED_FIELDS) {
            if (body[field] !== undefined) {
                // Güvenlik: Telegram Bot Token ve Chat ID asla kazara boşaltılamaz veya maskelenmiş olarak ezilemez
                if (field === 'telegramBotToken') {
                    const tokenVal = String(body[field]).trim()
                    if (!tokenVal || tokenVal.includes('•') || tokenVal.length < 20) {
                        continue // Mevcut korunan token'ı koru
                    }
                }
                if (field === 'telegramChatId') {
                    const chatVal = String(body[field]).trim()
                    if (!chatVal || chatVal.includes('•')) {
                        continue // Mevcut korunan chat ID'yi koru
                    }
                }

                // @ts-ignore
                extendedUpdate[field] = body[field]
                hasExtendedUpdate = true
            }
        }

        const extended = hasExtendedUpdate ? saveExtendedSettings(extendedUpdate) : getExtendedSettings()

        return NextResponse.json({
            success: true,
            data: {
                ...extended,
                ...settings
            }
        })
    } catch (error) {
        console.error("Error updating settings:", error)
        return NextResponse.json({ error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) }, { status: 500 })
    }
}
