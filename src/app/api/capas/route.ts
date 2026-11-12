import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

// Helper: CAPA numarası oluştur
async function generateCAPANumber(): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `CAPA-${year}-`

    const lastCAPA = await prisma.cAPA.findFirst({
        where: { capaNumber: { startsWith: prefix } },
        orderBy: { capaNumber: 'desc' }
    })

    let nextNumber = 1
    if (lastCAPA) {
        const lastNumber = parseInt(lastCAPA.capaNumber.split('-')[2])
        nextNumber = lastNumber + 1
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`
}

// GET /api/capas - CAPA listesi
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const type = searchParams.get('type')

        const where: any = {}
        if (status) where.status = status
        if (type) where.type = type

        const capas = await prisma.cAPA.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(capas)
    } catch (error) {
        console.error('Error fetching CAPAs:', error)
        return NextResponse.json(
            { error: 'CAPA kayıtları yüklenirken hata oluştu' },
            { status: 500 }
        )
    }
}

// POST /api/capas - Yeni CAPA oluştur
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            title,
            description,
            type,
            source,
            rootCause,
            correctiveAction,
            preventiveAction,
            assignedTo,
            dueDate
        } = body

        if (!title || !description || !type) {
            return NextResponse.json(
                { error: 'Zorunlu alanlar eksik: title, description, type' },
                { status: 400 }
            )
        }

        const capaNumber = await generateCAPANumber()

        const capa = await prisma.cAPA.create({
            data: {
                capaNumber,
                title,
                description,
                type, // CORRECTIVE, PREVENTIVE
                source,
                rootCause,
                correctiveAction,
                preventiveAction,
                assignedTo,
                dueDate: dueDate ? new Date(dueDate) : null,
                status: 'OPEN'
            }
        })

        // Audit Log
        await createAuditLog({
            userName: 'System',
            action: 'CREATE',
            entity: 'CAPA',
            entityId: capa.id,
            afterValue: capa
        })

        return NextResponse.json(capa, { status: 201 })
    } catch (error) {
        console.error('Error creating CAPA:', error)
        return NextResponse.json(
            { error: 'CAPA oluşturulurken hata oluştu' },
            { status: 500 }
        )
    }
}

// PUT /api/capas - CAPA durum/bilgi güncelle
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const {
            id,
            status,
            rootCause,
            correctiveAction,
            preventiveAction,
            effectivenessNotes,
            assignedTo
        } = body

        if (!id) {
            return NextResponse.json({ error: 'CAPA id gereklidir' }, { status: 400 })
        }

        const updateData: any = {}
        if (status) {
            updateData.status = status
            if (status === 'COMPLETED' || status === 'CLOSED') {
                updateData.completedAt = new Date()
            }
            if (status === 'CLOSED') {
                updateData.effectiveness = effectivenessNotes || 'Etkinlik doğrulandı ve kapatıldı'
            }
        }
        if (rootCause !== undefined) updateData.rootCause = rootCause
        if (correctiveAction !== undefined) updateData.correctiveAction = correctiveAction
        if (preventiveAction !== undefined) updateData.preventiveAction = preventiveAction
        if (effectivenessNotes !== undefined) updateData.effectiveness = effectivenessNotes
        if (assignedTo !== undefined) updateData.assignedTo = assignedTo

        const updated = await prisma.cAPA.update({
            where: { id },
            data: updateData
        })

        await createAuditLog({
            userName: 'System',
            action: 'UPDATE',
            entity: 'CAPA',
            entityId: updated.id,
            afterValue: updated
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Error updating CAPA:', error)
        return NextResponse.json(
            { error: 'CAPA güncellenirken hata oluştu' },
            { status: 500 }
        )
    }
}
