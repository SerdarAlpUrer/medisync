import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { LicenseManager } from '@/lib/license-manager'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        // Check if user is authenticated and is admin/manager
        const session = await getServerSession()
        if (!session?.user) {
            return NextResponse.json(
                { success: false, message: 'Yetkilendirme gerekli' },
                { status: 401 }
            )
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email! }
        })

        if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER')) {
            return NextResponse.json(
                { success: false, message: 'Bu işlem için admin veya yönetici yetkisi gerekli' },
                { status: 403 }
            )
        }

        const body = await req.json()
        const { licenseKey } = body

        if (!licenseKey) {
            return NextResponse.json(
                { success: false, message: 'Lisans anahtarı gerekli' },
                { status: 400 }
            )
        }

        // Use existing LicenseManager to activate
        const result = await LicenseManager.activateLicense(licenseKey)

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: result.message
            })
        } else {
            return NextResponse.json(
                { success: false, message: result.message },
                { status: 400 }
            )
        }
    } catch (error) {
        console.error('License activation error:', error)
        return NextResponse.json(
            { success: false, message: 'Lisans aktivasyonu sırasında hata oluştu' },
            { status: 500 }
        )
    }
}
