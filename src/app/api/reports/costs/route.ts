import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const hospitalId = searchParams.get('hospitalId')
        const range = searchParams.get('range') || 'thisYear'

        // Calculate date range
        const now = new Date()
        let startDate: Date
        let endDate: Date = now

        switch (range) {
            case 'thisMonth':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                break
            case 'lastMonth':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                endDate = new Date(now.getFullYear(), now.getMonth(), 0)
                break
            case 'lastYear':
                startDate = new Date(now.getFullYear() - 1, 0, 1)
                endDate = new Date(now.getFullYear() - 1, 11, 31)
                break
            case 'thisYear':
            default:
                startDate = new Date(now.getFullYear(), 0, 1)
                break
        }

        // Build where clause - use createdAt instead of completedDate to get all records
        const maintenanceWhere: any = {
            createdAt: {
                gte: startDate,
                lte: endDate
            },
            cost: { not: null }
        }

        // Filter by hospital through device relationship
        if (hospitalId) {
            maintenanceWhere.device = { hospitalId }
        }

        // Get all maintenance records with costs
        const maintenanceRecords = await prisma.maintenanceRecord.findMany({
            where: maintenanceWhere,
            include: {
                device: {
                    select: {
                        id: true,
                        name: true,
                        brand: true,
                        model: true,
                        hospitalId: true,
                        location: {
                            select: { name: true }
                        }
                    }
                }
            }
        })

        // Build work order where clause
        const workOrderWhere: any = {
            createdAt: {
                gte: startDate,
                lte: endDate
            },
            cost: { not: null }
        }

        // Filter by hospital through device relationship
        if (hospitalId) {
            workOrderWhere.device = { hospitalId }
        }

        const workOrders = await prisma.workOrder.findMany({
            where: workOrderWhere,
            include: {
                device: {
                    select: {
                        id: true,
                        name: true,
                        brand: true,
                        model: true,
                        hospitalId: true,
                        location: {
                            select: { name: true }
                        }
                    }
                }
            }
        })

        // Calculate totals
        let maintenanceCost = 0
        let sparepartsCost = 0
        let calibrationCost = 0

        maintenanceRecords.forEach(record => {
            const cost = Number(record.cost) || 0
            if (record.type === 'CALIBRATION') {
                calibrationCost += cost
            } else {
                maintenanceCost += cost
            }
            // Spareparts cost from work orders or record sparepartsCost field
            if ((record as any).sparepartsCost) {
                sparepartsCost += Number((record as any).sparepartsCost)
            }
        })

        workOrders.forEach(wo => {
            maintenanceCost += Number(wo.cost) || 0
        })

        const totalCost = maintenanceCost + sparepartsCost + calibrationCost

        // Group by device
        const deviceCosts: Record<string, { deviceId: string, deviceName: string, brand: string, totalCost: number, maintenanceCount: number }> = {}

        maintenanceRecords.forEach(record => {
            const deviceId = record.deviceId
            if (!deviceCosts[deviceId]) {
                deviceCosts[deviceId] = {
                    deviceId,
                    deviceName: record.device?.name || 'Bilinmiyor',
                    brand: record.device?.brand || '',
                    totalCost: 0,
                    maintenanceCount: 0
                }
            }
            deviceCosts[deviceId].totalCost += Number(record.cost) || 0
            deviceCosts[deviceId].maintenanceCount++
        })

        workOrders.forEach(wo => {
            const deviceId = wo.deviceId
            if (!deviceCosts[deviceId]) {
                deviceCosts[deviceId] = {
                    deviceId,
                    deviceName: wo.device?.name || 'Bilinmiyor',
                    brand: wo.device?.brand || '',
                    totalCost: 0,
                    maintenanceCount: 0
                }
            }
            deviceCosts[deviceId].totalCost += Number(wo.cost) || 0
            deviceCosts[deviceId].maintenanceCount++
        })

        const byDevice = Object.values(deviceCosts).sort((a, b) => b.totalCost - a.totalCost)

        // Group by department (location)
        const deptCosts: Record<string, { department: string, totalCost: number, deviceCount: number }> = {}

        maintenanceRecords.forEach(record => {
            const dept = record.device?.location?.name || 'Bilinmiyor'
            if (!deptCosts[dept]) {
                deptCosts[dept] = { department: dept, totalCost: 0, deviceCount: 0 }
            }
            deptCosts[dept].totalCost += Number(record.cost) || 0
            deptCosts[dept].deviceCount++
        })

        workOrders.forEach(wo => {
            const dept = wo.device?.location?.name || 'Bilinmiyor'
            if (!deptCosts[dept]) {
                deptCosts[dept] = { department: dept, totalCost: 0, deviceCount: 0 }
            }
            deptCosts[dept].totalCost += Number(wo.cost) || 0
            deptCosts[dept].deviceCount++
        })

        const byDepartment = Object.values(deptCosts).sort((a, b) => b.totalCost - a.totalCost)

        // Monthly trend for this year - use createdAt for consistency
        const monthlyData: Record<string, number> = {}
        const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

        maintenanceRecords.forEach(record => {
            const date = record.completedDate || record.createdAt
            if (date) {
                const month = new Date(date).getMonth()
                const monthKey = months[month]
                monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (Number(record.cost) || 0)
            }
        })

        workOrders.forEach(wo => {
            const date = wo.completedAt || wo.createdAt
            if (date) {
                const month = new Date(date).getMonth()
                const monthKey = months[month]
                monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (Number(wo.cost) || 0)
            }
        })

        const monthly = months.map(month => ({
            month,
            cost: monthlyData[month] || 0
        }))

        return NextResponse.json({
            totalCost,
            maintenanceCost,
            sparepartsCost,
            calibrationCost,
            byDevice,
            byDepartment,
            monthly
        })
    } catch (error) {
        logger.error('Error fetching cost report:', error as Error)
        return NextResponse.json({ error: 'Maliyet raporu oluşturulamadı' }, { status: 500 })
    }
}
