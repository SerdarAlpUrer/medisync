import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRateLimit } from '@/lib/rate-limit'
import { successResponse, errorResponse } from '@/lib/api-response'
import { handleError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { cache, cacheKeys, redisCache } from '@/lib/cache'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { getExtendedSettings } from '@/lib/extended-settings'

async function getDashboard(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        let hospitalId = searchParams.get('hospitalId')

        try {
            const user = await getAuthenticatedUser()
            if (user?.hospitalId) {
                hospitalId = user.hospitalId
            }
        } catch { }

        const extSettings = getExtendedSettings()
        const calAlertDays = extSettings.calibrationAlertDays || 30
        const warAlertDays = extSettings.warrantyAlertDays || 30

        // Base where clause for hospital filtering
        const deviceWhere: any = hospitalId ? { hospitalId } : {}
        const maintenanceWhere: any = hospitalId ? { hospitalId } : {}

        // Calculate dates based on user settings
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const sevenDaysFromNow = new Date()
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + calAlertDays)

        // OPTIMIZED: Single parallel query execution for all statistics
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + warAlertDays)

        const [
            deviceStatusCounts,
            calibrationCount,
            maintenanceRecords,
            workOrders,
            maintenanceCostAgg,
            workOrderCostAgg,
            upcomingCalibrations,

            upcomingWarrantyExpiries,
            maintenanceCostByType,
            deviceCategoryDistribution
        ] = await Promise.all([
            // Get all device status counts in one query
            prisma.device.groupBy({
                by: ['status'],
                where: deviceWhere,
                _count: true,
            }),
            // Calibration count
            prisma.device.count({
                where: {
                    ...deviceWhere,
                    OR: [
                        { status: 'CALIBRATION' },
                        {
                            nextCalibrationDate: {
                                lte: sevenDaysFromNow
                            }
                        }
                    ]
                }
            }),
            // Recent maintenances
            prisma.maintenanceRecord.findMany({
                where: maintenanceWhere,
                take: 5,
                orderBy: {
                    scheduledDate: 'desc'
                },
                include: {
                    device: {
                        select: {
                            name: true,
                            brand: true,
                            model: true
                        }
                    }
                }
            }),
            // Recent work orders
            prisma.workOrder.findMany({
                where: maintenanceWhere,
                take: 5,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    device: {
                        select: {
                            name: true,
                            brand: true,
                            model: true
                        }
                    }
                }
            }),
            // Monthly maintenance cost - include all records created this month
            prisma.maintenanceRecord.aggregate({
                where: {
                    ...maintenanceWhere,
                    createdAt: { gte: firstDayOfMonth },
                    cost: { not: null }
                },
                _sum: {
                    cost: true
                }
            }),
            // Monthly work order cost - include all from this month
            prisma.workOrder.aggregate({
                where: {
                    ...maintenanceWhere,
                    createdAt: { gte: firstDayOfMonth },
                    cost: { not: null }
                },
                _sum: {
                    cost: true
                }
            }),
            // Upcoming calibrations
            prisma.device.findMany({
                where: {
                    ...deviceWhere,
                    OR: [
                        { status: 'CALIBRATION' },
                        {
                            nextCalibrationDate: {
                                not: null,
                                lte: sevenDaysFromNow,
                                gte: now
                            }
                        }
                    ]
                },
                take: 5,
                orderBy: {
                    nextCalibrationDate: 'asc'
                },
                select: {
                    id: true,
                    name: true,
                    brand: true,
                    model: true,
                    nextCalibrationDate: true,
                    status: true
                }
            }),
            // Upcoming warranty expiries (next 30 days)
            prisma.device.findMany({
                where: {
                    ...deviceWhere,
                    warrantyExpiry: {
                        not: null,
                        lte: thirtyDaysFromNow,
                        gte: now
                    }
                },
                take: 5,
                orderBy: {
                    warrantyExpiry: 'asc'
                },
                select: {
                    id: true,
                    name: true,
                    brand: true,
                    model: true,
                    warrantyExpiry: true,
                    serialNumber: true
                }
            }),
            // Cost distribution by maintenance type (Monthly)
            prisma.maintenanceRecord.groupBy({
                by: ['type'],
                where: {
                    ...maintenanceWhere,
                    createdAt: { gte: firstDayOfMonth },
                    cost: { not: null }
                },
                _sum: { cost: true }
            }),
            // Device category distribution
            prisma.device.groupBy({
                by: ['name'], // Using name as category/type for now
                where: deviceWhere,
                _count: true
            })
        ])

        // Extract counts from groupBy result
        const totalDevices = deviceStatusCounts.reduce((sum, item) => sum + item._count, 0)
        const activeDevices = deviceStatusCounts.find(s => s.status === 'ACTIVE')?._count || 0
        const inMaintenance = deviceStatusCounts
            .filter(s => ['MAINTENANCE', 'IN_MAINTENANCE', 'REPAIR', 'UNDER_REPAIR'].includes(s.status))
            .reduce((sum, item) => sum + item._count, 0)
        const needsCalibration = calibrationCount

        // Normalize and combine recent maintenances
        const normalizedWorkOrders = workOrders.map(wo => ({
            id: wo.id,
            device: wo.device,
            type: wo.type === 'CORRECTIVE' ? 'Arıza Bildirimi' : wo.type,
            status: wo.status,
            date: wo.createdAt,
            cost: wo.cost || 0,
            isWorkOrder: true
        }))

        const normalizedMaintenance = maintenanceRecords.map(m => ({
            id: m.id,
            device: m.device,
            type: m.type,
            status: m.status,
            date: m.scheduledDate,
            cost: m.cost || 0,
            isWorkOrder: false
        }))

        const combinedRecent = [...normalizedMaintenance, ...normalizedWorkOrders]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5) // Ensure we only return top 5

        const monthlyMaintenanceCost = (maintenanceCostAgg._sum.cost || 0) + (workOrderCostAgg._sum.cost || 0)

        const dashboardData = {
            stats: {
                totalDevices,
                activeDevices,
                inMaintenance,
                needsCalibration,
                monthlyMaintenanceCost,
                warrantyExpiringCount: upcomingWarrantyExpiries.length
            },
            recentMaintenances: combinedRecent.map((item: any) => ({
                id: item.id,
                device: `${item.device.name} - ${item.device.brand} ${item.device.model}`,
                type: item.type,
                status: item.status,
                cost: item.cost,
                date: new Date(item.date).toISOString().split('T')[0]
            })),
            upcomingCalibrations: upcomingCalibrations.map((c: any) => ({
                device: `${c.name} - ${c.brand} ${c.model}`,
                dueDate: c.nextCalibrationDate ? c.nextCalibrationDate.toISOString().split('T')[0] : '',
                priority: 'medium'
            })),
            upcomingWarrantyExpiries: upcomingWarrantyExpiries.map((d: any) => {
                const expiryDate = new Date(d.warrantyExpiry)
                const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                return {
                    id: d.id,
                    device: `${d.name} - ${d.brand} ${d.model}`,
                    serialNumber: d.serialNumber,
                    expiryDate: expiryDate.toISOString().split('T')[0],
                    daysRemaining: daysUntilExpiry,
                    priority: daysUntilExpiry <= 7 ? 'high' : daysUntilExpiry <= 14 ? 'medium' : 'low'
                }
            }),
            charts: {
                statusDistribution: deviceStatusCounts.map(item => {
                    const statusLabels: Record<string, string> = {
                        ACTIVE: 'Aktif',
                        INACTIVE: 'Pasif',
                        MAINTENANCE: 'Bakımda',
                        IN_MAINTENANCE: 'Bakımda',
                        CALIBRATION: 'Kalibrasyonda',
                        IN_CALIBRATION: 'Kalibrasyonda',
                        REPAIR: 'Onarımda',
                        UNDER_REPAIR: 'Onarımda',
                        DECOMMISSIONED: 'Hizmet Dışı',
                        SCRAPPED: 'Hurda'
                    }
                    return {
                        name: statusLabels[item.status] || item.status,
                        value: item._count
                    }
                }),
                costDistribution: maintenanceCostByType.map(item => {
                    const typeLabels: Record<string, string> = {
                        PREVENTIVE: 'Önleyici Bakım',
                        CORRECTIVE: 'Arıza Onarımı',
                        PREDICTIVE: 'Öngörücü Bakım',
                        INSPECTION: 'Muayene & Kontrol',
                        EMERGENCY: 'Acil Müdahale',
                        CALIBRATION: 'Kalibrasyon'
                    }
                    return {
                        name: typeLabels[item.type] || item.type,
                        value: item._sum.cost || 0
                    }
                }),
                categoryDistribution: deviceCategoryDistribution
                    .sort((a, b) => b._count - a._count)
                    .slice(0, 5) // Top 5 categories
                    .map(item => ({
                        name: item.name,
                        value: item._count
                    }))
            }
        }

        // Backward compatibility: Return direct object (old format)
        // Frontend expects direct object, not wrapped in successResponse
        return NextResponse.json(dashboardData)
    } catch (error) {
        logger.error('Error fetching dashboard data', error as Error)
        const errorInfo = handleError(error)
        return errorResponse(errorInfo.message, errorInfo.statusCode, errorInfo.code, errorInfo.details)
    }
}

export const GET = withRateLimit(getDashboard)
