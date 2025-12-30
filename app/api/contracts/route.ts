import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/contracts - List All Contracts
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const hospitalId = searchParams.get('hospitalId')
        const supplierId = searchParams.get('supplierId')
        const status = searchParams.get('status')
        const search = searchParams.get('search')

        const where: any = {}

        if (hospitalId) where.hospitalId = hospitalId
        if (supplierId) where.supplierId = supplierId
        if (status && status !== 'ALL') where.status = status

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { contractNumber: { contains: search, mode: 'insensitive' } },
            ]
        }

        const contracts = await prisma.contract.findMany({
            where,
            include: {
                hospital: true,
                supplier: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return NextResponse.json(contracts)
    } catch (error) {
        console.error('Error fetching contracts:', error)
        return NextResponse.json(
            { error: 'Sözleşmeler yüklenirken hata oluştu' },
            { status: 500 }
        )
    }
}

// POST /api/contracts - Create New Contract
export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Zorunlu alan kontrolü
        if (!body.name || !body.startDate || !body.endDate || !body.hospitalId) {
            return NextResponse.json(
                { error: 'Zorunlu alanlar eksik (İsim, Başlangıç/Bitiş Tarihi, Hastane)' },
                { status: 400 }
            )
        }

        const contract = await prisma.contract.create({
            data: {
                name: body.name,
                contractNumber: body.contractNumber,
                startDate: new Date(body.startDate),
                endDate: new Date(body.endDate),
                price: body.price ? parseFloat(body.price) : undefined,
                currency: body.currency || 'TRY',
                partsIncluded: body.partsIncluded === true,
                description: body.description,
                documentPath: body.documentPath,
                status: body.status || 'ACTIVE',
                hospitalId: body.hospitalId,
                supplierId: body.supplierId || null,
            },
            include: {
                hospital: true,
                supplier: true,
            },
        })

        return NextResponse.json(contract, { status: 201 })
    } catch (error: any) {
        console.error('Error creating contract:', error)
        return NextResponse.json(
            { error: `Sözleşme oluşturulurken hata oluştu: ${error.message || error}` },
            { status: 500 }
        )
    }
}
