
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CATEGORIES = {
    'Görüntüleme': [
        'MRI Cihazı',
        'BT Tarayıcı (CT)',
        'Röntgen Cihazı',
        'Ultrason Cihazı',
        'Mamografi Cihazı',
        'Floroskopi Cihazı',
        'Seyyar Röntgen',
        'Kemik Dansitometresi',
        'Doppler Ultrason',
        'C Kollu Skopi',
        'Anjiyografi Cihazı',
        'Mobil Ultrason'
    ],
    'Yaşam Destek': [
        'Ventilatör',
        'Defibrilatör',
        'Anestezi Cihazı',
        'Kalp Akciğer Makinesi',
        'İnfüzyon Pompası',
        'Oksijen Konsantratörü',
        'Bebek Küvözü',
        'Radyant Isıtıcı',
        'Perfüzatör',
        'Hasta Başı Monitörü',
        'Pulse Oksimetre',
        'Fetal Monitör',
        'EKG Cihazı',
        'Holter Monitörü'
    ],
    'Tedavi': [
        'Diyaliz Makinesi',
        'Radyoterapi Cihazı',
        'Fototerapi Cihazı',
        'Koter Cihazı',
        'Nebulizatör',
        'ESWL Cihazı',
        'Fizik Tedavi Ultrasonu',
        'Tens Cihazı',
        'Traksiyon Cihazı',
        'Lazer Epilasyon',
        'Diş Üniti'
    ],
    'Laboratuvar': [
        'Mikroskop',
        'Santrifüj',
        'Kan Analiz Cihazı',
        'Otoklav',
        'İnkübatör',
        'Biyokimya Analizörü',
        'Elisa Okuyucu',
        'Koagülometre',
        'Kan Gazı Cihazı',
        'İdrar Analizörü',
        'Hücre Sayım Cihazı',
        'Mikrotom',
        'Doku Takip Cihazı',
        'Su Banyosu',
        'Hassas Terazi',
        'pH Metre'
    ],
    'Cerrahi': [
        'Ameliyat Masası',
        'Ameliyat Lambası',
        'Aspiratör',
        'Laparoskopi Seti',
        'Artroskopi Seti',
        'Endoskopi Cihazı',
        'Kolonoskopi Cihazı',
        'Gastroskopi Cihazı',
        'Kriyoterapi Cihazı',
        'Turnike Cihazı'
    ],
    'Sterilizasyon ve Yıkama': [
        'Sterilizatör',
        'Ultrasonik Yıkayıcı',
        'Yıkama Dezenfektör',
        'Paketleme Cihazı'
    ],
    'Demirbaş ve Mobilya': [
        'Hasta Yatağı',
        'Sedye',
        'Tekerlekli Sandalye',
        'Muayene Masası',
        'Serum Askısı',
        'Eskabo',
        'İlaç Arabası',
        'Pansuman Arabası',
        'Acil Müdahale Arabası (Crash Cart)',
        'Terazi'
    ],
    'Diğer': [
        'Tansiyon Aleti',
        'Ateş Ölçer',
        'Otoskop',
        'Oftalmoskop',
        'Laringoskop',
        'Dermatoskop',
        'Spirometre',
        'Odyometre'
    ]
};

async function main() {
    console.log('Cihaz kategorileri veritabanına ekleniyor/güncelleniyor...');

    let count = 0;

    for (const [groupName, devices] of Object.entries(CATEGORIES)) {
        for (const catName of devices) {
            try {
                const trimmedName = catName.trim();
                // Türkçe karakterleri ve boşlukları düzenle
                let code = trimmedName
                    .toLocaleUpperCase('tr-TR')
                    .replace(/\s+/g, '_')
                    .replace(/İ/g, 'I')
                    .replace(/Ğ/g, 'G')
                    .replace(/Ü/g, 'U')
                    .replace(/Ş/g, 'S')
                    .replace(/Ö/g, 'O')
                    .replace(/Ç/g, 'C');

                await prisma.deviceCategory.upsert({
                    where: { code: code },
                    update: {
                        name: trimmedName,
                        group: groupName
                    },
                    create: {
                        name: trimmedName,
                        code: code,
                        group: groupName,
                        description: `${groupName} grubu ${trimmedName} cihazı`
                    }
                });
                process.stdout.write('.');
                count++;
            } catch (e) {
                console.error(`\nHata (${catName}):`, e);
            }
        }
    }

    console.log(`\n\nBaşarıyla tamamlandı! Toplam ${count} kategori işlendi.`);
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
