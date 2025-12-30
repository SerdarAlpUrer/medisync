import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const hospitals = await prisma.hospital.findMany({
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
