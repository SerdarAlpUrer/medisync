import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateWorkOrderNumber } from '@/lib/tag-generator'
import { withRateLimit } from '@/lib/rate-limit'
import { successResponse, errorResponse } from '@/lib/api-response'
import { handleError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Validation schema for fault report
const faultReportSchema = z.object({
    deviceId: z.string().min(1, 'Cihaz ID gereklidir'),
    hospitalId: z.string().min(1, 'Hastane ID gereklidir'),
    description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır').max(1000),
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
            select: { id: true, name: true }
        })

        if (!device) {
            return errorResponse('Cihaz bulunamadı', 404, 'NOT_FOUND')
        }

        // Verify hospital exists
        const hospital = await prisma.hospital.findUnique({
            where: { id: hospitalId },
            select: { id: true }
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
                hospitalId,
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

        // Bildirim oluştur - tüm admin ve teknisyenlere gönder
        try {
            const usersToNotify = await prisma.user.findMany({
                where: {
                    role: { in: ['ADMIN', 'TECHNICIAN', 'ENGINEER'] },
                    isActive: true,
                },
                select: { id: true }
            })

            if (usersToNotify.length > 0) {
                await prisma.inAppNotification.createMany({
                    data: usersToNotify.map(user => ({
                        userId: user.id,
                        title: '🔧 Yeni Arıza Bildirimi',
                        message: `${device.name} cihazı için arıza bildirimi: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`,
                        type: 'fault_report',
                        priority: urgency === 'URGENT' ? 'high' : urgency === 'HIGH' ? 'high' : 'medium',
                        link: `/dashboard/maintenance`,
                        read: false,
                    }))
                })
            }
        } catch (notifError) {
            // Bildirim hatası ana işlemi engellememeli
            logger.warn('Failed to create notifications for fault report', { error: notifError })
        }

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

// Apply strict rate limiting to public endpoint (5 requests per 15 minutes)
export const POST = withRateLimit(createFaultReport, {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
})
