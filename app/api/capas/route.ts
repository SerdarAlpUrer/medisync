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
