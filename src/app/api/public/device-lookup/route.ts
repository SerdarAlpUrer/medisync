import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/public/device-lookup
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('query')

        if (!query) {
            return NextResponse.json({ error: 'Query parameter required' }, { status: 400 })
        }

        const device = await prisma.device.findFirst({
            where: {
                OR: [
                    { tagNumber: query },
                    { barcode: query },
                    { serialNumber: query }
                ]
            },
            select: {
                id: true,
                name: true,
                tagNumber: true,
                serialNumber: true,
                brand: true,
                model: true,
                hospitalId: true
            }
        })

        if (!device) {
            return NextResponse.json({ error: 'Device not found' }, { status: 404 })
        }

        return NextResponse.json(device)
    } catch (error) {
        console.error('Device lookup error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
