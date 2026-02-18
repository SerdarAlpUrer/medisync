import { NextResponse } from 'next/server'
import {
    queryUTSProduct,
    sendUTSNotification,
    checkUTSConnection,
    getMockProducts
} from '@/lib/uts-service'

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

        // Varsayılan: Simülasyon ürünlerini döndür
        const products = getMockProducts()
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
