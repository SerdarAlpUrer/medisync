import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const hospitalId = searchParams.get('hospitalId')

        const where: any = {}
        if (hospitalId) {
            where.hospitalId = hospitalId
        }

        const unmatched = await prisma.unmatchedCalibration.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(unmatched)
    } catch (error) {
        console.error('Error fetching unmatched calibrations:', error)
        return NextResponse.json(
            { error: 'Eşleşmeyen kayıtlar getirilemedi' },
            { status: 500 }
        )
    }
}
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        let ids = searchParams.get('ids')

        // Check for body if no ids in query
        if (!ids && !id) {
            try {
                const body = await request.json()
                if (body.ids) {
                    ids = Array.isArray(body.ids) ? body.ids.join(',') : body.ids
                }
            } catch (e) {
                // Body might be empty, ignore error
            }
        }

        if (ids) {
            // Bulk delete
            const idList = ids.split(',')
            await prisma.unmatchedCalibration.deleteMany({
                where: {
                    id: { in: idList }
                }
            })
            return NextResponse.json({ message: `${idList.length} kayıt silindi` })
        }

        if (id) {
            // Single delete
            await prisma.unmatchedCalibration.delete({
                where: { id }
            })
            return NextResponse.json({ message: 'Kayıt silindi' })
        }

        return NextResponse.json(
            { error: 'ID veya IDs parametresi gereklidir' },
            { status: 400 }
        )
    } catch (error) {
        console.error('Error deleting unmatched calibration:', error)
        return NextResponse.json(
            { error: `Silme işlemi başarısız oldu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}` },
            { status: 500 }
        )
    }
}
