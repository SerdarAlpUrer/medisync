import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { ids } = body

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: 'Silinecek cihaz IDleri belirtilmedi' },
                { status: 400 }
            )
        }

        const result = await prisma.device.deleteMany({
            where: {
                id: {
                    in: ids
                }
            }
        })

        return NextResponse.json({
            message: `${result.count} cihaz başarıyla silindi`,
            count: result.count
        })

    } catch (error) {
        console.error('Bulk delete error:', error)
        return NextResponse.json(
            { error: 'Toplu silme işlemi sırasında bir hata oluştu' },
            { status: 500 }
        )
    }
}
