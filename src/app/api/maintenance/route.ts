import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { getServerSession } from 'next-auth'
import { withRateLimit } from '@/lib/rate-limit'
import { successResponse, errorResponse } from '@/lib/api-response'
import { handleError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { createSearchWhere } from '@/lib/search'

// GET /api/maintenance - Tüm bakım kayıtlarını listele
async function getMaintenance(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const deviceId = searchParams.get('deviceId')
        const hospitalId = searchParams.get('hospitalId')

        const where: any = {}

        if (status && status !== 'ALL') {
            where.status = status
        }
        if (deviceId) {
            where.deviceId = deviceId
        }
        if (hospitalId) {
            where.hospitalId = hospitalId
        }

        const [maintenanceRecords, workOrders] = await Promise.all([
            prisma.maintenanceRecord.findMany({
                where,
                include: {
                    device: {
                        include: {
                            location: true
                        }
                    },
                    hospital: true,
                    technician: true,
                },
                orderBy: {
                    scheduledDate: 'desc',
                },
            }),
            prisma.workOrder.findMany({
                where,
                include: {
                    device: {
                        include: {
                            location: true
                        }
                    },
                    hospital: true,
                    assignedTo: true, // Map to technician
                },
                orderBy: {
                    createdAt: 'desc', // WorkOrder usually uses createdAt or scheduledDate
                },
            })
        ])

        // Map WorkOrders to look like MaintenanceRecords for the frontend
        const normalizedWorkOrders = workOrders.map(wo => ({
            ...wo,
            technician: wo.assignedTo, // Map assignedTo to technician
            technicianId: wo.assignedToId,
            // Ensure compatible status/type if needed
            isWorkOrder: true // Flag for frontend if needed
        }))

        // Combine and sort
        const combinedRecords = [...maintenanceRecords, ...normalizedWorkOrders].sort((a, b) => {
            const dateA = new Date(a.scheduledDate || a.createdAt).getTime()
            const dateB = new Date(b.scheduledDate || b.createdAt).getTime()
            return dateB - dateA
        })

        return successResponse(combinedRecords)
    } catch (error) {
        logger.error('Error fetching maintenance records', error as Error)
        const errorInfo = handleError(error)
        return errorResponse(errorInfo.message, errorInfo.statusCode, errorInfo.code, errorInfo.details)
    }
}

export const GET = withRateLimit(getMaintenance)

// POST /api/maintenance - Yeni bakım kaydı oluştur
async function createMaintenance(request: Request) {
    try {
        const body = await request.json()
        const session = await getServerSession()
        const userId = (session?.user as any)?.id || 'system'
        const userName = (session?.user as any)?.name || 'Sistem'
        
        // Validate required fields
        if (!body.deviceId || !body.hospitalId || !body.scheduledDate) {
            return errorResponse('Eksik alanlar: deviceId, hospitalId, scheduledDate gerekli', 400, 'VALIDATION_ERROR')
        }

        // Extract fields from body
        const {
            deviceId,
            hospitalId,
            technicianId,
            type,
            status,
            priority,
            scheduledDate,
            description,
            cost
        } = body

        // Prepare data for creation
        const maintenanceData: any = {
            deviceId,
            hospitalId,
            type,
            status,
            priority,
            scheduledDate: new Date(scheduledDate),
            description: description || null,
        }

        // Add optional fields
        if (technicianId) {
            maintenanceData.technicianId = technicianId
        }

        if (cost && cost !== '') {
            maintenanceData.cost = parseFloat(cost)
        }

        const maintenance = await prisma.maintenanceRecord.create({
            data: maintenanceData,
            include: {
                device: true,
                hospital: true,
                technician: true,
            },
        })

        // Audit Log
        if (session?.user?.id) {
            await createAuditLog({
                action: 'CREATE',
                entity: 'MaintenanceRecord',
                entityId: maintenance.id,
                userId: session.user.id,
                userName: session.user.name || session.user.email || 'Unknown',
                afterValue: {
                    ...body,
                    details: `Maintenance record created for device ${maintenance.device.name}`
                },
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
            })
        }

        // Cihazın son bakım tarihini güncelle
        if (status === 'COMPLETED') {
            await prisma.device.update({
                where: { id: deviceId },
                data: {
                    lastMaintenanceDate: new Date(scheduledDate),
                },
            })
        }

        logger.info('Maintenance record created', { maintenanceId: maintenance.id, deviceId: body.deviceId })
        return successResponse(maintenance, 201)
    } catch (error) {
        logger.error('Error creating maintenance record', error as Error)
        const errorInfo = handleError(error)
        return errorResponse(errorInfo.message, errorInfo.statusCode, errorInfo.code, errorInfo.details)
    }
}

export const POST = withRateLimit(createMaintenance, {
    maxRequests: 20,
    windowMs: 60000,
})

// PUT /api/maintenance - Bakım kaydını güncelle
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const session = await getServerSession()
        const userId = (session?.user as any)?.id || 'system'
        const userName = (session?.user as any)?.name || 'Sistem'

        const { id, isWorkOrder, ...updateData } = body

        if (!id) {
            return NextResponse.json(
                { error: 'Bakım kaydı ID gerekli' },
                { status: 400 }
            )
        }

        let updatedRecord;

        if (isWorkOrder) {
            // Update WorkOrder
            const workOrderUpdateData: any = {}
            if (updateData.title !== undefined) workOrderUpdateData.title = updateData.title
            if (updateData.description !== undefined) workOrderUpdateData.description = updateData.description
            if (updateData.status !== undefined) {
                workOrderUpdateData.status = updateData.status
                if (updateData.status === 'COMPLETED') {
                    workOrderUpdateData.completedAt = new Date()
                }
            }
            if (updateData.priority !== undefined) workOrderUpdateData.priority = updateData.priority
            if (updateData.type !== undefined) workOrderUpdateData.type = updateData.type
            if (updateData.deviceId !== undefined) workOrderUpdateData.deviceId = updateData.deviceId

            // Map technicianId to assignedToId for WorkOrder
            if (updateData.technicianId !== undefined) {
                workOrderUpdateData.assignedToId = updateData.technicianId || null
            }

            // Map scheduledDate
            if (updateData.scheduledDate !== undefined) {
                workOrderUpdateData.scheduledDate = new Date(updateData.scheduledDate)
            }

            if (updateData.scheduledDate !== undefined) {
                workOrderUpdateData.scheduledDate = new Date(updateData.scheduledDate)
            }

            // Map actions to actionsToken
            if (updateData.actions !== undefined) {
                workOrderUpdateData.actionsToken = updateData.actions
            }

            // Map cost
            if (updateData.cost !== undefined && updateData.cost !== '') {
                workOrderUpdateData.cost = parseFloat(updateData.cost)
            }

            const currentWorkOrder = await prisma.workOrder.findUnique({ where: { id } });

            updatedRecord = await prisma.workOrder.update({
                where: { id },
                data: workOrderUpdateData,
                include: {
                    device: true,
                    hospital: true,
                    assignedTo: true,
                },
            })

            // Audit Log for WorkOrder
            if (session?.user?.id) {
                await createAuditLog({
                    action: 'UPDATE',
                    entity: 'WorkOrder',
                    entityId: updatedRecord.id,
                    userId: session.user.id,
                    userName: session.user.name || session.user.email || 'Unknown',
                    beforeValue: currentWorkOrder || undefined,
                    afterValue: {
                        ...updatedRecord,
                        details: `Work order updated: ${updatedRecord.status}`
                    },
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
                })
            }

        } else {
            // Update MaintenanceRecord (Existing Logic)
            const maintenanceUpdateData: any = {}
            // ... map fields ...
            if (updateData.deviceId !== undefined) maintenanceUpdateData.deviceId = updateData.deviceId
            if (updateData.type !== undefined) maintenanceUpdateData.type = updateData.type
            if (updateData.status !== undefined) {
                maintenanceUpdateData.status = updateData.status
                if (updateData.status === 'COMPLETED') {
                    maintenanceUpdateData.completedDate = new Date()
                }
            }
            if (updateData.priority !== undefined) maintenanceUpdateData.priority = updateData.priority
            if (updateData.scheduledDate !== undefined) maintenanceUpdateData.scheduledDate = new Date(updateData.scheduledDate)
            if (updateData.scheduledDate !== undefined) maintenanceUpdateData.scheduledDate = new Date(updateData.scheduledDate)
            if (updateData.description !== undefined) maintenanceUpdateData.description = updateData.description || null
            if (updateData.actions !== undefined) maintenanceUpdateData.actions = updateData.actions || null

            if (updateData.technicianId !== undefined) {
                maintenanceUpdateData.technicianId = updateData.technicianId || null
            }

            if (updateData.cost !== undefined && updateData.cost !== '') {
                maintenanceUpdateData.cost = parseFloat(updateData.cost)
            }

            const currentMaintenance = await prisma.maintenanceRecord.findUnique({ where: { id } });

            updatedRecord = await prisma.maintenanceRecord.update({
                where: { id },
                data: maintenanceUpdateData,
                include: {
                    device: true,
                    hospital: true,
                    technician: true,
                },
            })

            // Audit Log for Maintenance
            if (session?.user?.id) {
                await createAuditLog({
                    action: 'UPDATE',
                    entity: 'MaintenanceRecord',
                    entityId: updatedRecord.id,
                    userId: session.user.id,
                    userName: session.user.name || session.user.email || 'Unknown',
                    beforeValue: currentMaintenance || undefined,
                    afterValue: {
                        ...updatedRecord,
                        details: `Maintenance record updated`
                    },
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
                })
            }
        }

        return NextResponse.json(updatedRecord)
    } catch (error) {
        console.error('Error updating maintenance record:', error)
        return NextResponse.json(
            { error: 'Bakım kaydı güncellenirken hata oluştu' },
            { status: 500 }
        )
    }
}

// DELETE /api/maintenance/[id] - Bakım kaydını sil
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const session = await getServerSession()
        const userId = (session?.user as any)?.id || 'system'
        const userName = (session?.user as any)?.name || 'Sistem'

        const id = searchParams.get('id')
        const isWorkOrder = searchParams.get('isWorkOrder') === 'true'

        if (!id) {
            return NextResponse.json(
                { error: 'Bakım kaydı ID gerekli' },
                { status: 400 }
            )
        }

        let deletedRecord: any

        if (isWorkOrder) {
            // Delete WorkOrder
            deletedRecord = await prisma.workOrder.delete({
                where: { id },
            })

            // Audit Log for WorkOrder
            if (session?.user?.id) {
                await createAuditLog({
                    action: 'DELETE',
                    entity: 'WorkOrder',
                    entityId: id,
                    userId: session.user.id,
                    userName: session.user.name || session.user.email || 'Unknown',
                    beforeValue: deletedRecord,
                    afterValue: {
                        details: `Work order deleted`
                    },
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
                })
            }
        } else {
            // Delete MaintenanceRecord
            deletedRecord = await prisma.maintenanceRecord.delete({
                where: { id },
            })

            // Audit Log for MaintenanceRecord
            if (session?.user?.id) {
                await createAuditLog({
                    action: 'DELETE',
                    entity: 'MaintenanceRecord',
                    entityId: id,
                    userId: session.user.id,
                    userName: session.user.name || session.user.email || 'Unknown',
                    beforeValue: deletedRecord,
                    afterValue: {
                        details: `Maintenance record deleted`
                    },
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
                })
            }
        }

        return NextResponse.json({ message: 'Bakım kaydı başarıyla silindi' })
    } catch (error) {
        console.error('Error deleting maintenance record:', error)
        return NextResponse.json(
            { error: 'Bakım kaydı silinirken hata oluştu' },
            { status: 500 }
        )
    }
}
