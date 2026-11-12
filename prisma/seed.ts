import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting seed...')

    // Hastane oluştur
    // Modül ayarlarını kontrol et
    let settings = await prisma.appSettings.findUnique({ where: { id: "default" } })
    if (!settings) {
        settings = await prisma.appSettings.create({
            data: {
                id: "default",
                maintenanceEnabled: false,
                calibrationEnabled: false,
                utsEnabled: false,
                complianceEnabled: false,
                reportsEnabled: false,
                branchesEnabled: false, // Varsayılan kapalı
            }
        })
    }

    let hospital;
    // Eğer şube modülü kapalıysa, tek bir merkez hastane oluştur/kullan
    if (!settings.branchesEnabled) {
        console.log('ℹ️ Şube modülü kapalı, Ana Hastane varsayılan olarak ayarlanıyor.')
        hospital = await prisma.hospital.upsert({
            where: { code: 'HSP001' },
            update: {},
            create: {
                name: 'Ana Hastane',
                code: 'HSP001',
                address: 'İstanbul, Türkiye',
                phone: '+90 212 555 0000',
                email: 'info@anahastane.com',
            },
        })
        console.log('✅ Hastane oluşturuldu:', hospital.name)
    } else {
        console.log('ℹ️ Şube modülü açık, varsayılan hastane oluşturulmadı. (Kullanıcı kendi tanımlayacak)')
        // Fallback for foreign keys if needed? 
        // If we don't create a hospital, the Admin User creation below (which links to hospitalId) might fail if it expects a valid ID.
        // However, the User model says `hospitalId String?`, so it's nullable.
        // BUT the seed script uses `hospital.id`. We need to handle this.
        // If hospital is undefined, we pass null to admin user.
    }

    // 1. Admin kullanıcı oluştur (Sadece tek yetkili yönetici hesabı)
    const hashedPassword = await bcrypt.hash('admin123', 10)

    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@medisync.com' },
        update: {
            role: 'ADMIN',
            isActive: true
        },
        create: {
            email: 'admin@medisync.com',
            name: 'Sistem Yöneticisi',
            password: hashedPassword,
            role: 'ADMIN',
            hospitalId: hospital?.id,
            department: 'Biyomedikal',
            isActive: true
        },
    })

    console.log('✅ Ana Yönetici (Admin) hesabı oluşturuldu:', adminUser.email)

    // Kategoriler oluştur (Standart Tıbbi Cihaz Sınıfları)
    const categories = await Promise.all([
        prisma.deviceCategory.upsert({
            where: { code: 'CAT001' },
            update: {},
            create: {
                name: 'Görüntüleme Cihazları',
                code: 'CAT001',
                description: 'MRI, CT, Röntgen vb.',
            },
        }),
        prisma.deviceCategory.upsert({
            where: { code: 'CAT002' },
            update: {},
            create: {
                name: 'Kardiyoloji',
                code: 'CAT002',
                description: 'EKG, Ekokardiyografi vb.',
            },
        }),
        prisma.deviceCategory.upsert({
            where: { code: 'CAT003' },
            update: {},
            create: {
                name: 'Acil Cihazlar',
                code: 'CAT003',
                description: 'Defibrilatör, Monitör vb.',
            },
        }),
    ])

    console.log('✅ Kategoriler oluşturuldu:', categories.length)

    // Lokasyonlar oluştur
    const locations = await Promise.all([
        prisma.location.upsert({
            where: { code: 'LOC001' },
            update: {},
            create: {
                name: 'Radyoloji',
                code: 'LOC001',
                building: 'A Blok',
                floor: '2',
                room: '201',
            },
        }),
        prisma.location.upsert({
            where: { code: 'LOC002' },
            update: {},
            create: {
                name: 'Acil Servis',
                code: 'LOC002',
                building: 'A Blok',
                floor: '1',
                room: '101',
            },
        }),
        prisma.location.upsert({
            where: { code: 'LOC003' },
            update: {},
            create: {
                name: 'Yoğun Bakım',
                code: 'LOC003',
                building: 'B Blok',
                floor: '3',
                room: 'ICU-1',
            },
        }),
    ])

    console.log('✅ Lokasyonlar oluşturuldu:', locations.length)

    console.log('\n========================================================')
    console.log('🎉 İlk Kurulum Tamamlandı!')
    console.log(`👤 Yönetici Hesabı : ${adminUser.email}`)
    console.log('🔑 Varsayılan Şifre : admin123')
    console.log('💡 Kurulum sonrası şifrenizi Ayarlar > Profil bölümünden değiştirmeniz önerilir.')
    console.log('========================================================\n')
}

main()
    .catch((e) => {
        console.error('❌ Seed hatası:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
