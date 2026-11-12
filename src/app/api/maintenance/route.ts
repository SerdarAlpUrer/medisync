import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withRateLimit } from '@/lib/rate-limit'
import { successResponse, errorResponse } from '@/lib/api-response'
import { handleError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { createSearchWhere } from '@/lib/search'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { cache, cacheKeys } from '@/lib/cache'
import { sendTelegramFaultAlert } from '@/lib/telegram'
import { sendWhatsAppFaultAlert } from '@/lib/whatsapp'

// GET /api/maintenance - Tüm bakım kayıtlarını listele
async function getMaintenance(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const deviceId = searchParams.get('deviceId')
        let hospitalId = searchParams.get('hospitalId')

        try {
            const user = await getAuthenticatedUser()
            const role = (user?.role || '').toUpperCase()
            const isTechnicalStaff = role === 'ADMIN' || role === 'ENGINEER' || role === 'TECHNICIAN' || role === 'SUPERVISOR'
            if (!isTechnicalStaff && user?.hospitalId) {
                hospitalId = user.hospitalId
            }
        } catch { }

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
                    technician: { select: { id: true, name: true, email: true, role: true, department: true, phone: true } },
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
                    assignedTo: { select: { id: true, name: true, email: true, role: true, department: true, phone: true } }, // Map to technician
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
        const session = await getServerSession(authOptions)
        const userId = (session?.user as any)?.id || 'system'
        const userName = (session?.user as any)?.name || 'Sistem'
        
        // Validate required fields
        if (!body.deviceId || !body.scheduledDate) {
            return errorResponse('Eksik alanlar: deviceId, scheduledDate gerekli', 400, 'VALIDATION_ERROR')
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
            cost,
            isActiveRepair,
            repairStartDate,
            repairEndDate,
            duration
        } = body

        // Prepare data for creation
        let targetHospitalId = hospitalId
        const sessionHospitalId = (session?.user as any)?.hospitalId
        if (sessionHospitalId) {
            targetHospitalId = sessionHospitalId
        }
        if (!targetHospitalId && deviceId) {
            const dev = await prisma.device.findUnique({ where: { id: deviceId }, select: { hospitalId: true } })
            targetHospitalId = dev?.hospitalId || undefined
        }
        if (!targetHospitalId) {
            const defaultHospital = await prisma.hospital.findFirst({ select: { id: true } })
            targetHospitalId = defaultHospital?.id
        }

        const isRepairType = type === 'CORRECTIVE' || type === 'EMERGENCY'
        const isRepair = isActiveRepair !== undefined ? Boolean(isActiveRepair) : isRepairType

        let parsedStartDate: Date | null = repairStartDate ? new Date(repairStartDate) : null
        let parsedEndDate: Date | null = repairEndDate ? new Date(repairEndDate) : null
        let parsedDuration: number | null = duration ? parseInt(duration, 10) : null

        // Tarihlerden süreyi otomatik hesapla
        if ((!parsedDuration || parsedDuration <= 0) && parsedStartDate && parsedEndDate) {
            parsedDuration = Math.max(0, Math.round((parsedEndDate.getTime() - parsedStartDate.getTime()) / (60 * 1000)))
        }

        // Süre verilmiş ve arıza tamamlandıysa bitiş tarihini otomatik doldur
        if (parsedDuration && parsedDuration > 0 && parsedStartDate && !parsedEndDate && status === 'COMPLETED') {
            parsedEndDate = new Date(parsedStartDate.getTime() + parsedDuration * 60 * 1000)
        }

        const maintenanceData: any = {
            deviceId,
            hospitalId: targetHospitalId,
            type: type || 'PERIODIC',
            status: status || 'SCHEDULED',
            priority: priority || 'MEDIUM',
            scheduledDate: new Date(scheduledDate),
            description: description || 'Bakım / Arıza Kaydı',
            isActiveRepair: isRepair,
            repairStartDate: parsedStartDate,
            repairEndDate: parsedEndDate,
            duration: parsedDuration,
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
                device: {
                    include: {
                        location: true
                    }
                },
                hospital: true,
                technician: { select: { id: true, name: true, email: true, role: true, department: true, phone: true } },
            },
        })

        // Telegram Anlık Arıza & Bakım Bildirimi
        sendTelegramFaultAlert({
            deviceId,
            deviceName: maintenance.device?.name || 'Cihaz',
            deviceTag: maintenance.device?.tagNumber || undefined,
            brandModel: [maintenance.device?.brand, maintenance.device?.model].filter(Boolean).join(' '),
            hospitalName: maintenance.hospital?.name || (maintenance.device as any)?.hospital?.name,
            departmentLocation: (maintenance.device as any)?.location?.name,
            reporterName: userName || session?.user?.name || 'Sistem',
            reporterPhone: (session?.user as any)?.phone || (maintenance.technician as any)?.phone,
            reporterTitle: (session?.user as any)?.role ? `Rol: ${(session?.user as any)?.role}` : undefined,
            priority: priority || 'MEDIUM',
            description: `${type === 'CORRECTIVE' ? '🚨 [ARIZA/ONARIM]' : '🔧 [PERİYODİK BAKIM]'} - ${description || 'Kayıt açıldı'}`,
            scheduledDate
        }).catch(err => {
            logger.warn('Telegram maintenance alert async error', { error: err })
        })

        // WhatsApp Anlık Arıza & Bakım Bildirimi (Teknisyen & Mühendis Ekibi)
        sendWhatsAppFaultAlert({
            deviceId,
            deviceName: maintenance.device?.name || 'Cihaz',
            deviceTag: maintenance.device?.tagNumber || undefined,
            brandModel: [maintenance.device?.brand, maintenance.device?.model].filter(Boolean).join(' '),
            hospitalName: maintenance.hospital?.name || (maintenance.device as any)?.hospital?.name,
            departmentLocation: (maintenance.device as any)?.location?.name,
            reporterName: userName || session?.user?.name || 'Sistem',
            reporterPhone: (session?.user as any)?.phone || (maintenance.technician as any)?.phone,
            reporterTitle: (session?.user as any)?.role ? `Rol: ${(session?.user as any)?.role}` : undefined,
            priority: priority || 'MEDIUM',
            description: `${type === 'CORRECTIVE' ? '🚨 [ARIZA/ONARIM]' : '🔧 [PERİYODİK BAKIM]'} - ${description || 'Kayıt açıldı'}`,
            scheduledDate
        }).catch(err => {
            logger.warn('WhatsApp maintenance alert async error', { error: err })
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

        // Cihazın son bakım tarihini ve durumunu güncelle
        if (status === 'COMPLETED') {
            await prisma.device.update({
                where: { id: deviceId },
                data: {
                    lastMaintenanceDate: new Date(scheduledDate),
                    status: 'ACTIVE',
                },
            })
        } else if (status === 'IN_PROGRESS') {
            await prisma.device.update({
                where: { id: deviceId },
                data: {
                    status: 'IN_MAINTENANCE',
                },
            })
        }

        cache.delete(cacheKeys.devices('*'))
        cache.delete('dashboard:*')

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
        const session = await getServerSession(authOptions)
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

            // Uptime/Downtime & Süre takibi
            if (updateData.repairStartDate !== undefined) {
                workOrderUpdateData.startedAt = updateData.repairStartDate ? new Date(updateData.repairStartDate) : null
            }
            if (updateData.repairEndDate !== undefined) {
                workOrderUpdateData.completedAt = updateData.repairEndDate ? new Date(updateData.repairEndDate) : null
            }
            if (updateData.duration !== undefined && updateData.duration !== '') {
                workOrderUpdateData.laborHours = parseFloat(updateData.duration) / 60
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
                    assignedTo: { select: { id: true, name: true, email: true, role: true, department: true, phone: true } },
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

            // Uptime/Downtime & Arıza Süresi Takibi
            if (updateData.repairStartDate !== undefined) {
                maintenanceUpdateData.repairStartDate = updateData.repairStartDate ? new Date(updateData.repairStartDate) : null
            }
            if (updateData.repairEndDate !== undefined) {
                maintenanceUpdateData.repairEndDate = updateData.repairEndDate ? new Date(updateData.repairEndDate) : null
            }
            if (updateData.duration !== undefined) {
                maintenanceUpdateData.duration = updateData.duration ? parseInt(updateData.duration, 10) : null
            }
            if (updateData.isActiveRepair !== undefined) {
                maintenanceUpdateData.isActiveRepair = Boolean(updateData.isActiveRepair)
            } else if (updateData.type === 'CORRECTIVE' || updateData.type === 'EMERGENCY') {
                maintenanceUpdateData.isActiveRepair = true
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
                    technician: { select: { id: true, name: true, email: true, role: true, department: true, phone: true } },
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

        // Cihaz durumunu ve son bakım tarihini senkronize et
        const targetDeviceId = updatedRecord?.deviceId
        if (targetDeviceId && updateData.status) {
            if (updateData.status === 'COMPLETED') {
                await prisma.device.update({
                    where: { id: targetDeviceId },
                    data: {
                        status: 'ACTIVE',
                        lastMaintenanceDate: new Date(),
                    },
                }).catch(() => {})
            } else if (updateData.status === 'IN_PROGRESS') {
                await prisma.device.update({
                    where: { id: targetDeviceId },
                    data: {
                        status: 'IN_MAINTENANCE',
                    },
                }).catch(() => {})
            }
        }

        cache.delete(cacheKeys.devices('*'))
        cache.delete('dashboard:*')

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
        const session = await getServerSession(authOptions)
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

        cache.delete(cacheKeys.devices('*'))
        cache.delete('dashboard:*')

        return NextResponse.json({ message: 'Bakım kaydı başarıyla silindi' })
    } catch (error) {
        console.error('Error deleting maintenance record:', error)
        return NextResponse.json(
            { error: 'Bakım kaydı silinirken hata oluştu' },
            { status: 500 }
        )
    }
}
