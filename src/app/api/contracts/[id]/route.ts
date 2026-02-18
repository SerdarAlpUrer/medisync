import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'



// GET /api/contracts/[id] - Get Single Contract
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params
        const contract = await prisma.contract.findUnique({
            where: { id: params.id },
            include: {
                hospital: true,
                supplier: true,
            },
        })

        if (!contract) {
            return NextResponse.json(
                { error: 'Sözleşme bulunamadı' },
                { status: 404 }
            )
        }

        return NextResponse.json(contract)
    } catch (error) {
        console.error('Error fetching contract:', error)
        return NextResponse.json(
            { error: 'Sözleşme detayları yüklenirken hata oluştu' },
            { status: 500 }
        )
    }
}

// PUT /api/contracts/[id] - Update Contract
export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params
        const body = await request.json()

        const contract = await prisma.contract.update({
            where: { id: params.id },
            data: {
                name: body.name,
                contractNumber: body.contractNumber,
                startDate: body.startDate ? new Date(body.startDate) : undefined,
                endDate: body.endDate ? new Date(body.endDate) : undefined,
                price: body.price ? parseFloat(body.price) : undefined,
                currency: body.currency,
                partsIncluded: body.partsIncluded,
                description: body.description,
                documentPath: body.documentPath,
                status: body.status,
                supplierId: body.supplierId || null,
            },
            include: {
                hospital: true,
                supplier: true,
            },
        })

        return NextResponse.json(contract)
    } catch (error) {
        console.error('Error updating contract:', error)
        return NextResponse.json(
            { error: 'Sözleşme güncellenirken hata oluştu' },
            { status: 500 }
        )
    }
}

// DELETE /api/contracts/[id] - Delete Contract
export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params
        await prisma.contract.delete({
            where: { id: params.id },
        })

        return NextResponse.json({ message: 'Sözleşme başarıyla silindi' })
    } catch (error: any) {
        console.error('Error deleting contract:', error)
        return NextResponse.json(
            { error: `Sözleşme silinirken hata oluştu: ${error.message || error}` },
            { status: 500 }
        )
    }
}
