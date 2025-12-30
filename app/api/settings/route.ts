import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client' // Add this import
// import { prisma } from '@/lib/prisma' // Remove or comment out this line

const prisma = new PrismaClient() // Instantiate PrismaClient here

export async function GET() {
    try {
        let settings = await prisma.appSettings.findUnique({
            where: { id: "default" }
        })

        if (!settings) {
            settings = await prisma.appSettings.create({
                data: {
                    id: "default",
                    // Prisma defaults will handle the rest
                }
            })
        }

        // Fallback: If deviceTagFormat is missing (old client), fetch it via raw SQL
        // @ts-ignore
        if (settings && settings.deviceTagFormat === undefined) {
            try {
                const rawResult: any[] = await prisma.$queryRaw`SELECT "deviceTagFormat" FROM "app_settings" WHERE id = 'default'`
                if (rawResult.length > 0 && rawResult[0].deviceTagFormat) {
                    // @ts-ignore
                    settings.deviceTagFormat = rawResult[0].deviceTagFormat
                } else {
                    // @ts-ignore
                    settings.deviceTagFormat = "TAG-{YYYY}-{SEQ}" // Default
                }
            } catch (rawError) {
                console.warn("Raw query failed:", rawError)
            }
        }

        return NextResponse.json(settings)
    } catch (error) {
        console.error("Error fetching settings:", error)
        return NextResponse.json({ error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json()

        // Only include defined fields in the update
        const updateData: any = {}
        const fields = [
            'maintenanceEnabled', 'calibrationEnabled', 'contractsEnabled',
            'utsEnabled', 'complianceEnabled', 'reportsEnabled',
            'branchesEnabled', 'trainingEnabled', 'procurementEnabled',
            'decommissioningEnabled', 'backupAuto', 'backupSchedule',
            'backupRetention', 'deviceTagFormat'
        ]

        for (const field of fields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field]
            }
        }

        let settings;

        try {
            settings = await prisma.appSettings.upsert({
                where: { id: "default" },
                update: updateData,
                create: {
                    id: "default",
                    ...updateData
                }
            })
        } catch (primaError: any) {
            // Check if error is due to unknown field (old client)
            if (primaError.message?.includes('Unknown argument') && updateData.deviceTagFormat) {
                console.warn("Client mismatch detected, retrying without new field and using raw SQL...")

                // Remove problematic field
                const { deviceTagFormat, ...safeUpdateData } = updateData

                // Retry standard upsert
                settings = await prisma.appSettings.upsert({
                    where: { id: "default" },
                    update: safeUpdateData,
                    create: {
                        id: "default",
                        ...safeUpdateData
                    }
                })

                // Update new field via raw SQL
                await prisma.$executeRawUnsafe('UPDATE "app_settings" SET "deviceTagFormat" = $1 WHERE id = \'default\'', deviceTagFormat)

                // Manually add to result
                // @ts-ignore
                settings.deviceTagFormat = deviceTagFormat
            } else {
                throw primaError
            }
        }

        return NextResponse.json(settings)
    } catch (error) {
        console.error("Error updating settings:", error)
        return NextResponse.json({ error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) }, { status: 500 })
    }
}
