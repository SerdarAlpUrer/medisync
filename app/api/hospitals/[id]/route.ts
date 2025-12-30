import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        console.log('Updating hospital:', id, body)
        const { name, code, address, phone, email } = body

        const hospital = await prisma.hospital.update({
            where: { id },
            data: {
                name,
                code,
                address,
                phone,
                email
            }
        })

        return NextResponse.json(hospital)
    } catch (error) {
        console.error('Error updating hospital:', error)
        return NextResponse.json(
            { error: 'Error updating hospital' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await prisma.hospital.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting hospital:', error)
        return NextResponse.json(
            { error: 'Error deleting hospital' },
            { status: 500 }
        )
    }
}
