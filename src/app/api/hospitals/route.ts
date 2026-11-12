import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

export async function GET() {
    try {
        let where: any = {}

        // Multi-tenant strict isolation:
        try {
            const user = await getAuthenticatedUser()
            // If user belongs to a specific hospital (tenant), strictly limit to their own hospital
            if (user?.hospitalId) {
                where.id = user.hospitalId
            }
        } catch {
            // Unauthenticated requests should NOT list any hospitals
            return NextResponse.json([])
        }

        const hospitals = await prisma.hospital.findMany({
            where,
            include: {
                _count: {
                    select: {
                        devices: true,
                        users: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })

        return NextResponse.json(hospitals)
    } catch (error) {
        console.error('Error fetching hospitals:', error)
        return NextResponse.json(
            { error: 'Hastaneler alınırken hata oluştu' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser()
        // Only global supervisors (no hospitalId constraint) can create new root hospital tenants
        if (user.hospitalId) {
            return NextResponse.json(
                { error: 'Yeni kurum ekleme yetkiniz bulunmamaktadır.' },
                { status: 403 }
            )
        }

        const body = await request.json()

        const hospital = await prisma.hospital.create({
            data: {
                name: body.name,
                code: body.code,
                address: body.address,
                phone: body.phone,
                email: body.email
            }
        })

        return NextResponse.json(hospital, { status: 201 })
    } catch (error) {
        console.error('Error creating hospital:', error)
        return NextResponse.json(
            { error: 'Hastane oluşturulurken hata oluştu' },
            { status: 500 }
        )
    }
}
