import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check if user is authenticated and is admin
        const session = await getServerSession()
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Yetkilendirme gerekli' },
                { status: 401 }
            )
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email! }
        })

        if (currentUser?.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Bu işlem için admin yetkisi gerekli' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { id } = await params
        console.log('Updating user:', id, body)
        const { name, email, role, department, phone, hospitalId, password } = body

        const updateData: any = {
            name,
            email,
            role,
            department,
            phone,
            hospitalId
        }

        // Only update password if a new one is provided
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10)
            updateData.password = hashedPassword
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json(user)
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json(
            { error: 'Error updating user' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check if user is authenticated and is admin
        const session = await getServerSession()
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Yetkilendirme gerekli' },
                { status: 401 }
            )
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email! }
        })

        if (currentUser?.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Bu işlem için admin yetkisi gerekli' },
                { status: 403 }
            )
        }

        const { id } = await params
        await prisma.user.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json(
            { error: 'Error deleting user' },
            { status: 500 }
        )
    }
}
