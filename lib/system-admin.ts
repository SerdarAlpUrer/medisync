import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Sistem genelini etkileyen işlemler (tam yedek indirme, geri yükleme, sıfırlama) için yetki kontrolü.
 * - Kullanıcı ADMIN olmalıdır.
 * - Sistemde birden fazla hastane varsa, yalnızca bir hastaneye bağlı OLMAYAN (merkez/süper) yönetici
 *   bu işlemleri yapabilir. Böylece bir hastane yöneticisi diğer hastanelerin verilerini indiremez/silemez.
 * Yetkisizse NextResponse döner, yetkiliyse null döner.
 */
export async function requireSystemAdmin(actionLabel: string): Promise<NextResponse | null> {
    const session = await getServerSession(authOptions)
    const user = session?.user as any

    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json(
            { error: `Yetkisiz erişim. Yalnızca sistem yöneticisi ${actionLabel}.` },
            { status: 403 }
        )
    }

    if (user.hospitalId) {
        const hospitalCount = await prisma.hospital.count()
        if (hospitalCount > 1) {
            return NextResponse.json(
                { error: `Sistemde birden fazla hastane bulunduğu için bu işlemi yalnızca merkez sistem yöneticisi yapabilir (${actionLabel}).` },
                { status: 403 }
            )
        }
    }

    return null
}
