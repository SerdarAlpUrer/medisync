import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/public/fault-tracking?code=WO-202X-XXXX
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')

        if (!code) {
            return NextResponse.json(
                { error: 'Referans kodu gerekli' },
                { status: 400 }
            )
        }

        const workOrder = await prisma.workOrder.findUnique({
            where: {
                workOrderNumber: code
            },
            include: {
                device: {
                    select: {
                        name: true,
                        brand: true,
                        model: true
                    }
                }
            }
        })

        if (!workOrder) {
            return NextResponse.json(
                { error: 'Kayıt bulunamadı. Lütfen referans kodunu kontrol ediniz.' },
                { status: 404 }
            )
        }

        // Return safe public details
        return NextResponse.json({
            status: workOrder.status,
            createdAt: workOrder.createdAt,
            updatedAt: workOrder.updatedAt,
            completedAt: workOrder.completedAt,
            device: {
                name: workOrder.device.name,
                brand: workOrder.device.brand,
                model: workOrder.device.model
            },
            description: workOrder.description,
            actions: workOrder.actionsToken, // "Yapılan İşlemler"
            cost: workOrder.cost
        })

    } catch (error) {
        console.error('Error tracking fault:', error)
        return NextResponse.json(
            { error: 'Sorgulama sırasında bir hata oluştu' },
            { status: 500 }
        )
    }
}
