import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

async function generateRequestNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `DSR-${year}-`
    const lastReq = await prisma.dataSubjectRequest.findFirst({
        where: { requestNumber: { startsWith: prefix } },
        orderBy: { requestNumber: 'desc' }
    })
    let nextNumber = 1
    if (lastReq) {
        const parts = lastReq.requestNumber.split('-')
        const parsed = parseInt(parts[2] || '0', 10)
        if (!isNaN(parsed)) nextNumber = parsed + 1
    }
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`
}

// GET /api/kvkk - KVKK Veri Sahibi Başvuruları
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        const where: any = {}
        if (status && status !== 'ALL') {
            where.status = status
        }

        const requests = await prisma.dataSubjectRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        })

        // Normalize fields for UI compatibility
        const normalized = requests.map(r => ({
            ...r,
            requesterName: r.subjectName,
            requesterEmail: r.subjectEmail,
            requesterPhone: r.subjectPhone,
            responseNotes: r.response
        }))

        return NextResponse.json(normalized)
    } catch (error) {
        console.error('Error fetching KVKK requests:', error)
        return NextResponse.json(
            { error: 'KVKK talepleri yüklenirken hata oluştu' },
            { status: 500 }
        )
    }
}

// POST /api/kvkk - Yeni KVKK Veri Sahibi Başvurusu
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const subjectName = body.subjectName || body.requesterName
        const subjectEmail = body.subjectEmail || body.requesterEmail
        const subjectPhone = body.subjectPhone || body.requesterPhone
        const { requestType, description } = body

        if (!subjectName || !subjectEmail || !requestType || !description) {
            return NextResponse.json(
                { error: 'Zorunlu alanlar eksik: Ad Soyad, E-posta, Talep Türü ve Açıklama gereklidir' },
                { status: 400 }
            )
        }

        const requestNumber = await generateRequestNumber()
        // KVKK 30-day statutory response deadline
        const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

        const created = await prisma.dataSubjectRequest.create({
            data: {
                requestNumber,
                subjectName,
                subjectEmail,
                subjectPhone: subjectPhone || null,
                requestType, // ACCESS, RECTIFICATION, ERASURE, PORTABILITY
                description,
                status: 'PENDING',
                dueDate
            }
        })

        await createAuditLog({
            userName: subjectName,
            action: 'CREATE',
            entity: 'DataSubjectRequest',
            entityId: created.id,
            afterValue: created
        })

        return NextResponse.json({
            ...created,
            requesterName: created.subjectName,
            requesterEmail: created.subjectEmail,
            requesterPhone: created.subjectPhone
        }, { status: 201 })
    } catch (error) {
        console.error('Error creating KVKK request:', error)
        return NextResponse.json(
            { error: 'KVKK talebi oluşturulurken hata oluştu' },
            { status: 500 }
        )
    }
}

// PUT /api/kvkk - KVKK Başvuru Durumu Güncelle
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, status, responseNotes, response, processedBy } = body

        if (!id || !status) {
            return NextResponse.json({ error: 'id ve status gereklidir' }, { status: 400 })
        }

        const updateData: any = {
            status,
        }
        if (responseNotes !== undefined || response !== undefined) {
            updateData.response = responseNotes ?? response
        }
        if (processedBy !== undefined) updateData.processedBy = processedBy
        if (status === 'COMPLETED' || status === 'REJECTED') {
            updateData.processedAt = new Date()
        }

        const updated = await prisma.dataSubjectRequest.update({
            where: { id },
            data: updateData
        })

        await createAuditLog({
            userName: processedBy || 'System',
            action: 'UPDATE',
            entity: 'DataSubjectRequest',
            entityId: updated.id,
            afterValue: updated
        })

        return NextResponse.json({
            ...updated,
            requesterName: updated.subjectName,
            requesterEmail: updated.subjectEmail,
            requesterPhone: updated.subjectPhone
        })
    } catch (error) {
        console.error('Error updating KVKK request:', error)
        return NextResponse.json(
            { error: 'KVKK talebi güncellenirken hata oluştu' },
            { status: 500 }
        )
    }
}
