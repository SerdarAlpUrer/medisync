/**
 * UTS (Ürün Takip Sistemi) Entegrasyon Servisi
 * 
 * Bu dosya TİTCK UTS API'sine bağlantı için hazırlanmıştır.
 * Şu an simülasyon modunda çalışıyor. Gerçek API erişimi için:
 * 1. .env dosyasına UTS_API_TOKEN ekleyin
 * 2. UTS_API_URL'i canlı ortama değiştirin
 * 
 * Test ortamı: https://utstvs.titck.gov.tr
 * Canlı ortam: https://uts.titck.gov.tr
 */

// Simülasyon modu kontrolü
const SIMULATION_MODE = !process.env.UTS_API_TOKEN

// API URL'leri
const UTS_API_URL = process.env.UTS_API_URL || 'https://utstvs.titck.gov.tr/api'
const UTS_API_TOKEN = process.env.UTS_API_TOKEN || ''

// UTS Ürün Tipi
export interface UTSProduct {
    utsKodu: string
    barkod: string
    urunAdi: string
    marka: string
    model: string
    uretici: string
    ulke: string
    riskSinifi: string
    ceIsareti: string
    kayitTarihi: string
    durum: 'AKTIF' | 'PASIF' | 'ASKIDA'
}

// Simülasyon verileri
const MOCK_PRODUCTS: UTSProduct[] = [
    {
        utsKodu: 'UTS-2026-001',
        barkod: '8680000000001',
        urunAdi: 'Hasta Monitörü PM-9000',
        marka: 'Mindray',
        model: 'PM-9000',
        uretici: 'Shenzhen Mindray Bio-Medical Electronics',
        ulke: 'Çin',
        riskSinifi: 'IIb',
        ceIsareti: 'CE-0123',
        kayitTarihi: '2026-01-15',
        durum: 'AKTIF'
    },
    {
        utsKodu: 'UTS-2026-002',
        barkod: '8680000000002',
        urunAdi: 'Defibrilatör HeartStart',
        marka: 'Philips',
        model: 'HeartStart FRx',
        uretici: 'Philips Medical Systems',
        ulke: 'Hollanda',
        riskSinifi: 'III',
        ceIsareti: 'CE-0344',
        kayitTarihi: '2026-02-20',
        durum: 'AKTIF'
    },
    {
        utsKodu: 'UTS-2026-003',
        barkod: '8680000000003',
        urunAdi: 'Ultrason Cihazı Logiq',
        marka: 'GE Healthcare',
        model: 'Logiq E10',
        uretici: 'GE Medical Systems',
        ulke: 'ABD',
        riskSinifi: 'IIa',
        ceIsareti: 'CE-0459',
        kayitTarihi: '2026-03-10',
        durum: 'AKTIF'
    }
]

/**
 * UTS'den ürün sorgula
 */
export async function queryUTSProduct(barkodOrUtsKodu: string): Promise<{
    success: boolean
    data?: UTSProduct
    error?: string
    isSimulation: boolean
}> {
    if (SIMULATION_MODE) {
        // Simülasyon modu
        await new Promise(resolve => setTimeout(resolve, 500)) // Gerçek API gecikmesi simülasyonu

        const product = MOCK_PRODUCTS.find(
            p => p.barkod === barkodOrUtsKodu || p.utsKodu === barkodOrUtsKodu
        )

        if (product) {
            return { success: true, data: product, isSimulation: true }
        }
        return {
            success: false,
            error: 'Ürün bulunamadı (Simülasyon)',
            isSimulation: true
        }
    }

    // Gerçek API çağrısı
    try {
        const response = await fetch(`${UTS_API_URL}/urun/sorgula`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${UTS_API_TOKEN}`
            },
            body: JSON.stringify({ sorguKodu: barkodOrUtsKodu })
        })

        if (!response.ok) {
            throw new Error(`UTS API hatası: ${response.status}`)
        }

        const data = await response.json()
        return { success: true, data, isSimulation: false }
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'UTS bağlantı hatası',
            isSimulation: false
        }
    }
}

/**
 * UTS'ye ürün bildirimi gönder (Alım/Verme)
 */
export async function sendUTSNotification(data: {
    type: 'ALIM' | 'VERME'
    utsKodu: string
    miktar: number
    lotNo?: string
    seriNo?: string
    aliciVkn?: string
    aciklama?: string
}): Promise<{
    success: boolean
    bildirimNo?: string
    error?: string
    isSimulation: boolean
}> {
    if (SIMULATION_MODE) {
        await new Promise(resolve => setTimeout(resolve, 800))

        const bildirimNo = `BLD-${Date.now()}`
        return {
            success: true,
            bildirimNo,
            isSimulation: true
        }
    }

    // Gerçek API çağrısı
    try {
        const response = await fetch(`${UTS_API_URL}/bildirim/gonder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${UTS_API_TOKEN}`
            },
            body: JSON.stringify(data)
        })

        if (!response.ok) {
            throw new Error(`UTS API hatası: ${response.status}`)
        }

        const result = await response.json()
        return { success: true, bildirimNo: result.bildirimNo, isSimulation: false }
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Bildirim gönderilemedi',
            isSimulation: false
        }
    }
}

/**
 * UTS bağlantı durumunu kontrol et
 */
export async function checkUTSConnection(): Promise<{
    connected: boolean
    mode: 'SIMULATION' | 'TEST' | 'PRODUCTION'
    message: string
}> {
    if (SIMULATION_MODE) {
        return {
            connected: false,
            mode: 'SIMULATION',
            message: 'Simülasyon modu aktif. Gerçek bağlantı için .env dosyasına UTS_API_TOKEN ekleyin.'
        }
    }

    try {
        const response = await fetch(`${UTS_API_URL}/health`, {
            headers: { 'Authorization': `Bearer ${UTS_API_TOKEN}` }
        })

        const isTest = UTS_API_URL.includes('utstvs')

        return {
            connected: response.ok,
            mode: isTest ? 'TEST' : 'PRODUCTION',
            message: response.ok ? 'UTS bağlantısı başarılı' : 'Bağlantı başarısız'
        }
    } catch {
        return {
            connected: false,
            mode: 'TEST',
            message: 'UTS sunucusuna erişilemiyor'
        }
    }
}

/**
 * Simülasyon için örnek ürünleri getir
 */
export function getMockProducts(): UTSProduct[] {
    return MOCK_PRODUCTS
}
