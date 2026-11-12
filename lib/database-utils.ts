import { prisma } from './prisma'

export async function exportDatabaseToJson() {
    const models = [
        'hospital',
        'user',
        'deviceCategory',
        'location',
        'supplier',
        'contract',
        'device',
        'maintenanceRecord',
        'calibrationRecord',
        'deviceMovement',
        'consumable',
        'deviceConsumable',
        'auditLog',
        'electronicSignature',
        'workOrder',
        'cAPA',
        'adverseEvent',
        'dataSubjectRequest',
        'appSettings',
        'inAppNotification',
        'pushSubscription',
        'unmatchedCalibration',
        'trainingRecord',
        'deviceTraining',
        'deviceProcurement',
        'deviceDecommissioning',
        'deviceUptime',
        // New models
        'staff',
        'trainingSession',
        'staffTraining',
        'trainingDocument',
        'systemLicense'
    ]

    const data: Record<string, any[]> = {}

    for (const model of models) {
        try {
            // @ts-ignore
            data[model] = await prisma[model].findMany()
        } catch (error) {
            console.error(`Error exporting model ${model}:`, error)
        }
    }

    return {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data
    }
}

export async function restoreDatabaseFromJson(json: any) {
    const { data } = json
    if (!data) throw new Error('Geçersiz yedek dosyası')

    // Models in delete order (children first, parents last)
    const models = [
        // Level 4/5 (Deepest dependencies)
        'staffTraining',
        'trainingDocument',
        'deviceConsumable',
        'electronicSignature',
        'deviceUptime',

        // Level 3 (Dependencies on Device/Staff/Training)
        'trainingSession',
        'deviceDecommissioning',
        'deviceProcurement',
        'deviceTraining',
        'maintenanceRecord',
        'calibrationRecord',
        'deviceMovement',
        'workOrder',
        'adverseEvent',
        'unmatchedCalibration',

        // Level 2 (Dependencies on User/Hospital/Location)
        'staff',
        'trainingRecord', // Old training module
        'device',
        'contract',
        'consumable',
        'auditLog',
        'inAppNotification',
        'pushSubscription',
        'dataSubjectRequest',
        'cAPA',

        // Level 1 (Base Catalogs)
        'user',
        'location',
        'supplier',
        'deviceCategory',

        // Level 0 (Roots)
        'hospital',
        'appSettings',
        'systemLicense'
    ]

    return await prisma.$transaction(async (tx) => {
        // Disable foreign key checks for PostgreSQL
        await tx.$executeRawUnsafe('SET session_replication_role = \'replica\';')

        try {
            // Clear existing data
            for (const model of models) {
                try {
                    // @ts-ignore
                    await tx[model].deleteMany()
                } catch (e: any) {
                    console.log(`Table for ${model} might not exist yet or clear failed: ${e.message}`)
                }
            }

            // High-level re-insert with batching
            const BATCH_SIZE = 100;

            for (const model of [...models].reverse()) {
                const records = data[model]
                if (records && Array.isArray(records) && records.length > 0) {
                    try {
                        console.log(`Restoring ${records.length} records to ${model}...`)

                        // Chunk records to avoid stack/parameter limits
                        for (let i = 0; i < records.length; i += BATCH_SIZE) {
                            const batch = records.slice(i, i + BATCH_SIZE);
                            // @ts-ignore
                            await tx[model].createMany({
                                data: batch,
                                skipDuplicates: true
                            })
                        }
                    } catch (error: any) {
                        console.error(`Error restoring model ${model}:`, error)
                        throw new Error(`${model} tablosu geri yüklenirken hata oluştu: ${error.message}`)
                    }
                }
            }
        } finally {
            // Re-enable foreign key checks
            await tx.$executeRawUnsafe('SET session_replication_role = \'origin\';')
        }

        return true
    }, {
        timeout: 60000 // 60 seconds timeout for large restores
    })
}
