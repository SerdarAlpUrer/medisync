import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateWorkOrderNumber } from '@/lib/tag-generator'
import { withRateLimit } from '@/lib/rate-limit'
import { successResponse, errorResponse } from '@/lib/api-response'
import { handleError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { cache, cacheKeys } from '@/lib/cache'
import { sendTelegramFaultAlert } from '@/lib/telegram'
import { sendWhatsAppFaultAlert } from '@/lib/whatsapp'
import { z } from 'zod'

// Validation schema for fault report
const faultReportSchema = z.object({
    deviceId: z.string().min(1, 'Cihaz ID gereklidir'),
    hospitalId: z.string().optional(),
    description: z.string().min(3, 'Açıklama en az 3 karakter olmalıdır').max(1000),
    urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    reporterName: z.string().min(1, 'İsim gereklidir').max(200),
    reporterPhone: z.string().max(50).optional(),
    reporterTitle: z.string().max(100).optional(),
})

// POST /api/public/fault-report
async function createFaultReport(request: Request) {
    try {
        const body = await request.json()

        // Validate input
        const validatedData = faultReportSchema.parse(body)
        const { deviceId, hospitalId, description, urgency, reporterName, reporterPhone, reporterTitle } = validatedData

        // Verify device exists
        const device = await prisma.device.findUnique({
            where: { id: deviceId },
            select: {
                id: true,
                name: true,
                tagNumber: true,
                brand: true,
                model: true,
                hospitalId: true,
                location: { select: { name: true } },
                hospital: { select: { name: true } }
            }
        })

        if (!device) {
            return errorResponse('Cihaz bulunamadı', 404, 'NOT_FOUND')
        }

        const effectiveHospitalId = hospitalId || device.hospitalId

        // Verify hospital exists
        const hospital = await prisma.hospital.findUnique({
            where: { id: effectiveHospitalId },
            select: { id: true, name: true }
        })

        if (!hospital) {
            return errorResponse('Hastane bulunamadı', 404, 'NOT_FOUND')
        }

        // İş Emri (WorkOrder) oluştur
        const workOrderNumber = await generateWorkOrderNumber(prisma)

        const workOrder = await prisma.workOrder.create({
            data: {
                workOrderNumber,
                deviceId,
                hospitalId: effectiveHospitalId,
                title: 'Arıza Bildirimi (Web)',
                description,
                type: 'CORRECTIVE',
                priority: urgency || 'MEDIUM',
                status: 'OPEN',
                reporterName,
                reporterPhone,
                reporterTitle,
                scheduledDate: new Date(),
                // Atanmamış, open olarak kalır
            }
        })

        // Cihaz durumunu otomatik Bakımda/Arızalı (IN_MAINTENANCE) olarak işaretle
        await prisma.device.update({
            where: { id: deviceId },
            data: { status: 'IN_MAINTENANCE' }
        }).catch(() => {})

        cache.delete(cacheKeys.devices('*'))
        cache.delete('dashboard:*')

        // Bildirim oluştur - ilgili hastane veya tüm admin ve teknisyenlere gönder
        try {
            const usersToNotify = await prisma.user.findMany({
                where: {
                    role: { in: ['ADMIN', 'TECHNICIAN', 'ENGINEER'] },
                    isActive: true,
                    OR: [
                        { hospitalId: effectiveHospitalId },
                        { hospitalId: null }
                    ]
                },
                select: { id: true }
            })

            if (usersToNotify.length > 0) {
                await prisma.inAppNotification.createMany({
                    data: usersToNotify.map(user => ({
                        userId: user.id,
                        title: '🔧 Yeni Arıza Bildirimi',
                        message: `${device.name} cihazı için arıza bildirimi: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`,
                        category: 'fault_report',
                        priority: urgency === 'URGENT' ? 'high' : urgency === 'HIGH' ? 'high' : 'medium',
                        actionUrl: `/dashboard/maintenance`,
                        read: false,
                    }))
                })
            }
        } catch (notifError) {
            // Bildirim hatası ana işlemi engellememeli
            logger.warn('Failed to create notifications for fault report', { error: notifError })
        }

        // Telegram Anlık Arıza Bildirimi Gönder
        sendTelegramFaultAlert({
            workOrderNumber: workOrder.workOrderNumber,
            deviceId,
            deviceName: device.name,
            deviceTag: device.tagNumber,
            brandModel: [device.brand, device.model].filter(Boolean).join(' '),
            hospitalName: hospital?.name || device.hospital?.name,
            departmentLocation: device.location?.name,
            reporterName,
            reporterPhone,
            reporterTitle,
            priority: urgency || 'MEDIUM',
            description,
            scheduledDate: new Date()
        }).catch(err => {
            logger.warn('Telegram fault alert async error', { error: err })
        })

        // WhatsApp Anlık Arıza Bildirimi Gönder (Teknisyen & Mühendis Ekibi)
        sendWhatsAppFaultAlert({
            workOrderNumber: workOrder.workOrderNumber,
            deviceId,
            deviceName: device.name,
            deviceTag: device.tagNumber,
            brandModel: [device.brand, device.model].filter(Boolean).join(' '),
            hospitalName: hospital?.name || device.hospital?.name,
            departmentLocation: device.location?.name,
            reporterName,
            reporterPhone,
            reporterTitle,
            priority: urgency || 'MEDIUM',
            description,
            scheduledDate: new Date()
        }).catch(err => {
            logger.warn('WhatsApp fault alert async error', { error: err })
        })

        logger.info('Fault report created', {
            workOrderNumber: workOrder.workOrderNumber,
            deviceId,
            hospitalId,
        })

        return successResponse({
            reportNumber: workOrder.workOrderNumber,
            message: 'Arıza bildirimi başarıyla oluşturuldu'
        }, 201)
    } catch (error) {
        logger.error('Fault report error', error as Error)

        // Handle Zod validation errors specifically
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors.map(err => ({
                path: err.path.join('.'),
                message: err.message
            }))
            return errorResponse(
                'Gönderilen veriler geçersiz. Lütfen tüm alanları kontrol edin.',
                400,
                'VALIDATION_ERROR',
                errorMessages
            )
        }

        const errorInfo = handleError(error)
        return errorResponse(errorInfo.message, errorInfo.statusCode, errorInfo.code, errorInfo.details)
    }
}

// Apply rate limiting suitable for a 500-bed hospital LAN (60 requests per 15 minutes per IP)
export const POST = withRateLimit(createFaultReport, {
    maxRequests: 60,
    windowMs: 15 * 60 * 1000, // 15 minutes
})
