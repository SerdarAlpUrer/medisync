import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET - Get current user profile
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Yetkilendirme gerekli" },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                hospital: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: "Kullanıcı bulunamadı" },
                { status: 404 }
            )
        }

        // Return user data (avatarUrl will be included if it exists)
        return NextResponse.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            department: user.department,
            phone: user.phone,
            avatarUrl: (user as any).avatarUrl || null,
            hospital: user.hospital
        })
    } catch (error) {
        console.error("Get user error:", error)
        return NextResponse.json(
            { error: "Kullanıcı bilgisi alınamadı" },
            { status: 500 }
        )
    }
}

