import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export async function POST() {
    try {
        // Sadece admin kullanıcılar sıfırlayabilir
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { success: false, message: "Yetkilendirme gerekli" },
                { status: 401 }
            )
        }

        // Lisansı sıfırla - yeni demo başlat
        await prisma.systemLicense.upsert({
            where: { id: "license" },
            update: {
                isDemo: true,
                isActive: true,
                firstRunDate: new Date(),
                demoDurationHours: 240, // 10 gün
                licenseKey: null,
                expiryDate: null,
                activationDate: null
            },
            create: {
                id: "license",
                isDemo: true,
                isActive: true,
                firstRunDate: new Date(),
                demoDurationHours: 240
            }
        })

        return NextResponse.json({
            success: true,
            message: "Lisans sıfırlandı. Demo süresi yeniden başladı."
        })

    } catch (error) {
        console.error("Lisans sıfırlama hatası:", error)
        return NextResponse.json(
            { success: false, message: "Lisans sıfırlanırken hata oluştu" },
            { status: 500 }
        )
    }
}
