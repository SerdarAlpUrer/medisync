import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

// Helper: Adverse Event numarası oluştur
async function generateReportNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `AE-${year}-`

    const lastEvent = await prisma.adverseEvent.findFirst({
        where: { reportNumber: { startsWith: prefix } },
        orderBy: { reportNumber: 'desc' }
    })

    let nextNumber = 1
    if (lastEvent) {
        const lastNumber = parseInt(lastEvent.reportNumber.split('-')[2])
        nextNumber = lastNumber + 1
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`
}

// GET /api/adverse-events - Olumsuz olay listesi
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const deviceId = searchParams.get('deviceId')
        const severity = searchParams.get('severity')

        const where: any = {}
        if (status) where.status = status
        if (deviceId) where.deviceId = deviceId
        if (severity) where.severity = severity

        try {
            const user = await getAuthenticatedUser()
            if (user?.hospitalId) where.device = { hospitalId: user.hospitalId }
        } catch { }

        const events = await prisma.adverseEvent.findMany({
            where,
            include: {
                device: { select: { id: true, name: true, tagNumber: true, serialNumber: true } }
            },
            orderBy: { eventDate: 'desc' }
        })

        return NextResponse.json(events)
    } catch (error) {
        console.error('Error fetching adverse events:', error)
        return NextResponse.json(
            { error: 'Olumsuz olay kayıtları yüklenirken hata oluştu' },
            { status: 500 }
        )
    }
}

// POST /api/adverse-events - Yeni olumsuz olay bildirimi
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            deviceId,
            eventDate,
            description,
            severity,
            investigationFindings,
            correctiveActions,
            preventiveActions
        } = body

        if (!deviceId || !eventDate || !description || !severity) {
            return NextResponse.json(
                { error: 'Zorunlu alanlar eksik: deviceId, eventDate, description, severity' },
                { status: 400 }
            )
        }

        const reportNumber = await generateReportNumber()

        const event = await prisma.adverseEvent.create({
            data: {
                reportNumber,
                deviceId,
                eventDate: new Date(eventDate),
                description,
                severity, // LOW, MEDIUM, HIGH, CRITICAL
                status: 'OPEN',
                investigationFindings,
                correctiveActions,
                preventiveActions
            },
            include: {
                device: true
            }
        })

        // Cihazın adverse event sayısını güncelle
        await prisma.device.update({
            where: { id: deviceId },
            data: { adverseEventsCount: { increment: 1 } }
        })

        // Audit Log - MDR Vigilance
        await createAuditLog({
            userName: 'System',
            action: 'CREATE',
            entity: 'AdverseEvent',
            entityId: event.id,
            afterValue: event
        })

        return NextResponse.json(event, { status: 201 })
    } catch (error) {
        console.error('Error creating adverse event:', error)
        return NextResponse.json(
            { error: 'Olumsuz olay bildirimi oluşturulurken hata oluştu' },
            { status: 500 }
        )
    }
}

// PUT /api/adverse-events - Olumsuz olay durum/bilgi güncelle
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const {
            id,
            status,
            reportedToTitck,
            titckReferenceNo,
            investigationFindings,
            correctiveActions,
            preventiveActions
        } = body

        if (!id) {
            return NextResponse.json({ error: 'Olay id gereklidir' }, { status: 400 })
        }

        const updateData: any = {}
        if (status) {
            updateData.status = status
            if (status === 'CLOSED' || status === 'RESOLVED') {
                updateData.closedAt = new Date()
            }
        }
        if (reportedToTitck !== undefined) {
            updateData.reportedToAuthority = Boolean(reportedToTitck)
            if (reportedToTitck) {
                updateData.reportedDate = new Date()
            }
        }
        if (titckReferenceNo !== undefined) updateData.authorityReportNumber = titckReferenceNo
        if (investigationFindings !== undefined) updateData.investigationFindings = investigationFindings
        if (correctiveActions !== undefined) updateData.correctiveActions = correctiveActions
        if (preventiveActions !== undefined) updateData.preventiveActions = preventiveActions

        const updated = await prisma.adverseEvent.update({
            where: { id },
            data: updateData,
            include: {
                device: { select: { id: true, name: true, tagNumber: true, serialNumber: true } }
            }
        })

        await createAuditLog({
            userName: 'System',
            action: 'UPDATE',
            entity: 'AdverseEvent',
            entityId: updated.id,
            afterValue: updated
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Error updating adverse event:', error)
        return NextResponse.json(
            { error: 'Olumsuz olay güncellenirken hata oluştu' },
            { status: 500 }
        )
    }
}
