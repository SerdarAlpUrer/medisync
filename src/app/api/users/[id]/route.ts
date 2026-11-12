import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const SAFE_USER_SELECT = {
    id: true,
    name: true,
    email: true,
    role: true,
    department: true,
    phone: true,
    hospitalId: true,
    isActive: true,
    avatarUrl: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
} as const

async function getAdminContext() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return { error: NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 }) }
    }
    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, hospitalId: true }
    })
    if (currentUser?.role !== 'ADMIN') {
        return { error: NextResponse.json({ error: 'Bu işlem için admin yetkisi gerekli' }, { status: 403 }) }
    }
    return { currentUser }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ctx = await getAdminContext()
        if (ctx.error) return ctx.error
        const currentUser = ctx.currentUser!

        const body = await request.json()
        const { id } = await params
        const { name, email, role, department, phone, hospitalId, password, isActive } = body

        const target = await prisma.user.findUnique({ where: { id }, select: { id: true, hospitalId: true } })
        if (!target) {
            return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
        }

        // Çoklu hastane izolasyonu: hastane yöneticisi yalnızca kendi hastanesinin kullanıcılarını düzenleyebilir
        if (currentUser.hospitalId && target.hospitalId !== currentUser.hospitalId) {
            return NextResponse.json({ error: 'Bu kullanıcıyı düzenleme yetkiniz yok' }, { status: 403 })
        }

        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (email !== undefined) updateData.email = String(email).trim().toLowerCase()
        if (role !== undefined) updateData.role = role
        if (department !== undefined) updateData.department = department
        if (phone !== undefined) updateData.phone = phone
        if (typeof isActive === 'boolean') updateData.isActive = isActive
        if (hospitalId !== undefined) {
            // Hastane yöneticisi kullanıcıyı başka hastaneye taşıyamaz
            updateData.hospitalId = currentUser.hospitalId ? currentUser.hospitalId : (hospitalId || null)
        }

        // Kendi yönetici yetkisini yanlışlıkla kaldırmayı engelle
        if (id === currentUser.id && role !== undefined && role !== 'ADMIN') {
            return NextResponse.json({ error: 'Kendi yönetici yetkinizi kaldıramazsınız' }, { status: 400 })
        }

        // Only update password if a new one is provided
        if (password && String(password).trim() !== '') {
            if (String(password).length < 6) {
                return NextResponse.json({ error: 'Şifre en az 6 karakter olmalıdır' }, { status: 400 })
            }
            updateData.password = await bcrypt.hash(String(password), 10)
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: SAFE_USER_SELECT
        })

        return NextResponse.json(user)
    } catch (error: any) {
        console.error('Error updating user:', error?.message || error)
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'Bu e-posta adresi başka bir kullanıcıda kayıtlı' }, { status: 400 })
        }
        return NextResponse.json(
            { error: 'Kullanıcı güncellenirken hata oluştu' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ctx = await getAdminContext()
        if (ctx.error) return ctx.error
        const currentUser = ctx.currentUser!

        const { id } = await params

        if (id === currentUser.id) {
            return NextResponse.json({ error: 'Kendi hesabınızı silemezsiniz' }, { status: 400 })
        }

        const target = await prisma.user.findUnique({ where: { id }, select: { id: true, hospitalId: true } })
        if (!target) {
            return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
        }
        if (currentUser.hospitalId && target.hospitalId !== currentUser.hospitalId) {
            return NextResponse.json({ error: 'Bu kullanıcıyı silme yetkiniz yok' }, { status: 403 })
        }

        await prisma.user.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json(
            { error: 'Kullanıcı silinirken hata oluştu' },
            { status: 500 }
        )
    }
}
