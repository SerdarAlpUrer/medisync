import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        let hospitalId = searchParams.get('hospitalId')

        try {
            const user = await getAuthenticatedUser()
            if (user?.hospitalId) {
                hospitalId = user.hospitalId
            }
        } catch { }

        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const hospitalWhere = hospitalId ? { hospitalId } : {}

        const [
            totalDevices,
            activeDevices,
            maintenanceThisMonth,
            calibrationThisMonth,
            maintenanceCost,
            calibrationCost
        ] = await Promise.all([
            prisma.device.count({ where: hospitalWhere }),
            prisma.device.count({ where: { ...hospitalWhere, status: 'ACTIVE' } }),
            prisma.maintenanceRecord.count({
                where: {
                    ...hospitalWhere,
                    scheduledDate: {
                        gte: firstDayOfMonth
                    }
                }
            }),
            prisma.calibrationRecord.count({
                where: {
                    ...hospitalWhere,
                    scheduledDate: {
                        gte: firstDayOfMonth
                    }
                }
            }),
            prisma.maintenanceRecord.aggregate({
                _sum: { cost: true },
                where: {
                    ...hospitalWhere,
                    scheduledDate: {
                        gte: firstDayOfMonth
                    }
                }
            }),
            prisma.calibrationRecord.aggregate({
                _sum: { cost: true },
                where: {
                    ...hospitalWhere,
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
