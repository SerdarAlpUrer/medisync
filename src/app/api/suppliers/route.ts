
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/suppliers - Tüm tedarikçileri listele
export async function GET() {
    try {
        const suppliers = await prisma.supplier.findMany({
            orderBy: {
                name: 'asc',
            },
            select: {
                id: true,
                name: true,
            }
        })

        return NextResponse.json(suppliers)
    } catch (error) {
        console.error('Error fetching suppliers:', error)
        return NextResponse.json(
            { error: 'Tedarikçiler yüklenirken hata oluştu' },
            { status: 500 }
        )
    }
}
