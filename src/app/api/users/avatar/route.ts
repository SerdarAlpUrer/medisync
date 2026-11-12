import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, unlink } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export const dynamic = 'force-dynamic'

// POST - Upload user avatar
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Yetkilendirme gerekli" },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json(
                { error: "Kullanıcı bulunamadı" },
                { status: 404 }
            )
        }

        const formData = await req.formData()
        const file = formData.get('avatar') as File

        if (!file) {
            return NextResponse.json(
                { error: "Dosya gerekli" },
                { status: 400 }
            )
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Sadece JPG, PNG ve GIF dosyaları kabul edilir" },
                { status: 400 }
            )
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json(
                { error: "Dosya boyutu 2MB'dan küçük olmalıdır" },
                { status: 400 }
            )
        }

        // Get file extension
        const extension = file.name.split('.').pop()
        const filename = `${user.id}.${extension}`
        const filepath = join(process.cwd(), 'public', 'uploads', 'avatars', filename)

        // Delete old avatar if exists
        if ((user as any).avatarUrl) {
            const oldPath = join(process.cwd(), 'public', (user as any).avatarUrl)
            if (existsSync(oldPath)) {
                try {
                    await unlink(oldPath)
                } catch (err) {
                    console.error("Error deleting old avatar:", err)
                }
            }
        }

        // Save new avatar
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filepath, buffer)

        // Update user avatar URL
        const avatarUrl = `/uploads/avatars/${filename}`
        await prisma.user.update({
            where: { id: user.id },
            data: { avatarUrl }
        })

        return NextResponse.json({
            success: true,
            avatarUrl
        })
    } catch (error) {
        console.error("Avatar upload error:", error)
        return NextResponse.json(
            { error: "Avatar yüklenemedi" },
            { status: 500 }
        )
    }
}

// DELETE - Remove user avatar
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Yetkilendirme gerekli" },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json(
                { error: "Kullanıcı bulunamadı" },
                { status: 404 }
            )
        }

        // Delete avatar file if exists
        if ((user as any).avatarUrl) {
            const filepath = join(process.cwd(), 'public', (user as any).avatarUrl)
            if (existsSync(filepath)) {
                try {
                    await unlink(filepath)
                } catch (err) {
                    console.error("Error deleting avatar:", err)
                }
            }
        }

        // Update user to remove avatar URL
        await prisma.user.update({
            where: { id: user.id },
            data: { avatarUrl: null }
        })

        return NextResponse.json({
            success: true,
            message: "Avatar kaldırıldı"
        })
    } catch (error) {
        console.error("Avatar delete error:", error)
        return NextResponse.json(
            { error: "Avatar kaldırılamadı" },
            { status: 500 }
        )
    }
}
