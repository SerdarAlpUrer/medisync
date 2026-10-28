import { NextResponse } from 'next/server'
import {
    queryUTSProduct,
    sendUTSNotification,
    checkUTSConnection,
    getMockProducts
} from '@/lib/uts-service'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

// GET /api/uts - Bağlantı durumu ve örnek ürünler
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const action = searchParams.get('action')
        const query = searchParams.get('query')

        // Bağlantı durumu kontrolü
        if (action === 'status') {
            const status = await checkUTSConnection()
            return NextResponse.json(status)
        }

        // Ürün sorgula
        if (action === 'query' && query) {
            const result = await queryUTSProduct(query)
            return NextResponse.json(result)
        }

        // Varsayılan: Veritabanındaki cihazlar ve simülasyon ürünlerini döndür
        const mockProducts = getMockProducts()
        let dbProducts: any[] = []
        try {
            const { prisma } = await import('@/lib/prisma')
            let hospitalId = searchParams.get('hospitalId')
            try {
                const user = await getAuthenticatedUser()
                if (user?.hospitalId) {
                    hospitalId = user.hospitalId
                }
            } catch { }
            const devices = await prisma.device.findMany({
                where: hospitalId ? { hospitalId } : undefined,
                take: 50,
                orderBy: { createdAt: 'desc' },
                include: { category: true }
            })
            dbProducts = devices.map(d => ({
                utsKodu: `UTS-${d.tagNumber || d.id.substring(0, 8).toUpperCase()}`,
                barkod: d.barcode || d.serialNumber || '8680000000000',
                urunAdi: d.name,
                marka: d.brand || 'Bilinmiyor',
                model: d.model || 'Bilinmiyor',
                uretici: d.manufacturer || d.brand || 'Belirtilmemiş',
                ulke: 'Türkiye',
                riskSinifi: d.category?.group?.includes('Yaşam Destek') ? 'III' : 'IIb',
                ceIsareti: 'CE-0123',
                kayitTarihi: d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : '2026-01-01',
                durum: d.status === 'ACTIVE' ? 'AKTIF' : 'PASIF'
            }))
        } catch (e) {
            // DB erişimi başarısızsa sadece mock dön
        }

        const products = [...dbProducts, ...mockProducts]
        const status = await checkUTSConnection()

        return NextResponse.json({
            status,
            products
        })
    } catch (error) {
        console.error('UTS API error:', error)
        return NextResponse.json(
            { error: 'UTS API hatası' },
            { status: 500 }
        )
    }
}

// POST /api/uts - Bildirim gönder
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { action } = body

        if (action === 'query') {
            const result = await queryUTSProduct(body.query)
            return NextResponse.json(result)
        }

        if (action === 'notification') {
            const result = await sendUTSNotification({
                type: body.type,
                utsKodu: body.utsKodu,
                miktar: body.miktar,
                lotNo: body.lotNo,
                seriNo: body.seriNo,
                aliciVkn: body.aliciVkn,
                aciklama: body.aciklama
            })
            return NextResponse.json(result)
        }

        return NextResponse.json(
            { error: 'Geçersiz işlem' },
            { status: 400 }
        )
    } catch (error) {
        console.error('UTS API error:', error)
        return NextResponse.json(
            { error: 'İşlem başarısız' },
            { status: 500 }
        )
    }
}
