import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        const [
            totalDevices,
            activeDevices,
            maintenanceThisMonth,
            calibrationThisMonth,
            maintenanceCost,
            calibrationCost
        ] = await Promise.all([
            prisma.device.count(),
            prisma.device.count({ where: { status: 'ACTIVE' } }),
            prisma.maintenanceRecord.count({
                where: {
                    scheduledDate: {
                        gte: firstDayOfMonth
                    }
                }
            }),
            prisma.calibrationRecord.count({
                where: {
                    scheduledDate: {
                        gte: firstDayOfMonth
                    }
                }
            }),
            prisma.maintenanceRecord.aggregate({
                _sum: { cost: true },
                where: {
                    scheduledDate: {
                        gte: firstDayOfMonth
                    }
                }
            }),
            prisma.calibrationRecord.aggregate({
                _sum: { cost: true },
                where: {
                    scheduledDate: {
                        gte: firstDayOfMonth
                    }
                }
            })
        ])

        const totalCost = (maintenanceCost._sum.cost || 0) + (calibrationCost._sum.cost || 0)

        return NextResponse.json({
            totalDevices,
            activeDevices,
            maintenanceThisMonth,
            calibrationThisMonth,
            totalCost
        })
    } catch (error) {
        return NextResponse.json(
            { error: 'Error fetching report stats' },
            { status: 500 }
        )
    }
}
