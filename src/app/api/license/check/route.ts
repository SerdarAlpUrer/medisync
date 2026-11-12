import { NextResponse } from "next/server"
import { LicenseManager } from "@/lib/license-manager"

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const status = await LicenseManager.checkLicense()
        return NextResponse.json(status)
    } catch (error) {
        console.error("Lisans API hatası:", error)
        return NextResponse.json(
            { type: 'ERROR', message: "Lisans kontrolü yapılamadı" },
            { status: 500 }
        )
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { licenseKey } = body

        if (!licenseKey) {
            return NextResponse.json(
                { success: false, message: "Lisans anahtarı gerekli" },
                { status: 400 }
            )
        }

        const result = await LicenseManager.activateLicense(licenseKey)

        if (!result.success) {
            return NextResponse.json(result, { status: 400 })
        }

        return NextResponse.json(result)

    } catch (error) {
        console.error("Aktivasyon hatası:", error)
        return NextResponse.json(
            { success: false, message: "Sunucu hatası" },
            { status: 500 }
        )
    }
}
