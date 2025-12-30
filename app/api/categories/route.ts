import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/categories - Tüm kategorileri listele
export async function GET() {
    try {
        const categories = await prisma.deviceCategory.findMany({
            orderBy: {
                name: 'asc',
            },
        })

        return NextResponse.json(categories)
    } catch (error) {
        console.error('Error fetching categories:', error)
        return NextResponse.json(
            { error: 'Kategoriler yüklenirken hata oluştu' },
            { status: 500 }
        )
    }
}
