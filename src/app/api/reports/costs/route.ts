import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
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

        if (hospitalId) {
            maintenanceWhere.OR = [
                { hospitalId },
                { device: { hospitalId } }
            ]
        }

        const workOrderWhere: any = {
            createdAt: {
                gte: startDate,
                lte: endDate
            },
            cost: { not: null }
        }

        if (hospitalId) {
            workOrderWhere.OR = [
                { hospitalId },
                { device: { hospitalId } }
            ]
        }

        const calibrationWhere: any = {
            createdAt: {
                gte: startDate,
                lte: endDate
            },
            cost: { not: null }
        }

        if (hospitalId) {
            calibrationWhere.OR = [
                { hospitalId },
                { device: { hospitalId } }
            ]
        }

        const deviceSelect = {
            id: true,
            name: true,
            brand: true,
            model: true,
            hospitalId: true,
            location: {
                select: { name: true }
            }
        }

        const [maintenanceRecords, workOrders, calibrationRecords] = await Promise.all([
            prisma.maintenanceRecord.findMany({
                where: maintenanceWhere,
                include: { device: { select: deviceSelect } }
            }),
            prisma.workOrder.findMany({
                where: workOrderWhere,
                include: { device: { select: deviceSelect } }
            }),
            prisma.calibrationRecord.findMany({
                where: calibrationWhere,
                include: { device: { select: deviceSelect } }
            })
        ])

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
            if ((record as any).sparepartsCost) {
                sparepartsCost += Number((record as any).sparepartsCost)
            }
        })

        workOrders.forEach(wo => {
            maintenanceCost += Number(wo.cost) || 0
        })

        calibrationRecords.forEach(cal => {
            calibrationCost += Number(cal.cost) || 0
        })

        const totalCost = maintenanceCost + sparepartsCost + calibrationCost

        // Group by device
        const deviceCosts: Record<string, { deviceId: string, deviceName: string, brand: string, totalCost: number, maintenanceCount: number }> = {}

        const addDeviceCost = (deviceId: string, device: any, costVal: number) => {
            if (!deviceId) return
            if (!deviceCosts[deviceId]) {
                deviceCosts[deviceId] = {
                    deviceId,
                    deviceName: device?.name || 'Bilinmiyor',
                    brand: device?.brand || '',
                    totalCost: 0,
                    maintenanceCount: 0
                }
            }
            deviceCosts[deviceId].totalCost += costVal
            deviceCosts[deviceId].maintenanceCount++
        }

        maintenanceRecords.forEach(r => addDeviceCost(r.deviceId, r.device, Number(r.cost) || 0))
        workOrders.forEach(wo => addDeviceCost(wo.deviceId, wo.device, Number(wo.cost) || 0))
        calibrationRecords.forEach(cal => addDeviceCost(cal.deviceId, cal.device, Number(cal.cost) || 0))

        const byDevice = Object.values(deviceCosts).sort((a, b) => b.totalCost - a.totalCost)

        // Group by department (location)
        const deptCosts: Record<string, { department: string, totalCost: number, deviceCount: number }> = {}

        const addDeptCost = (deptName: string | undefined, costVal: number) => {
            const dept = deptName || 'Bilinmiyor'
            if (!deptCosts[dept]) {
                deptCosts[dept] = { department: dept, totalCost: 0, deviceCount: 0 }
            }
            deptCosts[dept].totalCost += costVal
            deptCosts[dept].deviceCount++
        }

        maintenanceRecords.forEach(r => addDeptCost(r.device?.location?.name, Number(r.cost) || 0))
        workOrders.forEach(wo => addDeptCost(wo.device?.location?.name, Number(wo.cost) || 0))
        calibrationRecords.forEach(cal => addDeptCost(cal.device?.location?.name, Number(cal.cost) || 0))

        const byDepartment = Object.values(deptCosts).sort((a, b) => b.totalCost - a.totalCost)

        // Monthly trend for this year - use createdAt/completedDate for consistency
        const monthlyData: Record<string, number> = {}
        const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

        const addMonthlyCost = (date: Date | string | null | undefined, costVal: number) => {
            if (!date) return
            const month = new Date(date).getMonth()
            const monthKey = months[month]
            if (monthKey) {
                monthlyData[monthKey] = (monthlyData[monthKey] || 0) + costVal
            }
        }

        maintenanceRecords.forEach(r => addMonthlyCost(r.completedDate || r.createdAt, Number(r.cost) || 0))
        workOrders.forEach(wo => addMonthlyCost(wo.completedAt || wo.createdAt, Number(wo.cost) || 0))
        calibrationRecords.forEach(cal => addMonthlyCost(cal.completedDate || cal.scheduledDate || cal.createdAt, Number(cal.cost) || 0))

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
