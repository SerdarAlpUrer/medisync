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

    // Admin kullanıcı oluştur
    const hashedPassword = await bcrypt.hash('admin123', 10)

    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@biomedicapp.com' },
        update: {},
        create: {
            email: 'admin@biomedicapp.com',
            name: 'Admin User',
            password: hashedPassword,
            role: 'ADMIN',
            hospitalId: hospital?.id,
            department: 'Biyomedikal',
        },
    })

    console.log('✅ Admin kullanıcı oluşturuldu:', adminUser.email)

    // Test (Viewer) kullanıcı oluştur - Sadece görüntüleme yetkisi
    const testPassword = await bcrypt.hash('test123', 10)
    const testUser = await prisma.user.upsert({
        where: { email: 'test@medisync.com' },
        update: {},
        create: {
            email: 'test@medisync.com',
            name: 'Test Kullanıcı',
            password: testPassword,
            role: 'VIEWER',
            hospitalId: hospital?.id,
            department: 'Görüntüleme',
        },
    })

    console.log('✅ Test kullanıcı oluşturuldu:', testUser.email)

    // Kategoriler oluştur
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

    // Tedarikçi oluştur
    const supplier = await prisma.supplier.upsert({
        where: { code: 'SUP001' },
        update: {},
        create: {
            name: 'Medikal Ekipman A.Ş.',
            code: 'SUP001',
            contact: 'Ahmet Yılmaz',
            phone: '+90 212 555 1111',
            email: 'satis@medikalekipman.com',
        },
    })

    console.log('✅ Tedarikçi oluşturuldu:', supplier.name)

    // Demo cihazlar oluştur
    // Demo cihazlar oluştur (Sadece hastane varsa)
    let devices: any[] = []
    if (hospital) {
        devices = await Promise.all([
            prisma.device.upsert({
                where: { tagNumber: 'TAG-2026-001' },
                update: {},
                create: {
                    name: 'MRI Cihazı',
                    model: 'Siemens Magnetom Skyra 3T',
                    manufacturer: 'Siemens Healthineers',
                    serialNumber: 'SN-12345-MRI',
                    barcode: 'BC-12345-MRI',
                    categoryId: categories[0].id,
                    hospitalId: hospital.id,
                    locationId: locations[0].id,
                    supplierId: supplier.id,
                    purchaseDate: new Date('2020-05-15'),
                    purchasePrice: 5000000,
                    status: 'ACTIVE',
                    condition: 'EXCELLENT',
                    tagNumber: 'TAG-2026-001',
                    maintenanceInterval: 90,
                    calibrationInterval: 365,
                },
            }),
            prisma.device.upsert({
                where: { tagNumber: 'TAG-2026-002' },
                update: {},
                create: {
                    name: 'EKG Cihazı',
                    model: 'Philips PageWriter TC70',
                    manufacturer: 'Philips',
                    serialNumber: 'SN-44556-ECG',
                    barcode: 'BC-44556-ECG',
                    categoryId: categories[1].id,
                    hospitalId: hospital.id,
                    locationId: locations[1].id,
                    supplierId: supplier.id,
                    purchaseDate: new Date('2019-08-12'),
                    purchasePrice: 45000,
                    status: 'ACTIVE',
                    condition: 'GOOD',
                    tagNumber: 'TAG-2026-002',
                    maintenanceInterval: 180,
                    calibrationInterval: 365,
                },
            }),
            prisma.device.upsert({
                where: { tagNumber: 'TAG-2026-003' },
                update: {},
                create: {
                    name: 'Defibrilatör',
                    model: 'Zoll X Series',
                    manufacturer: 'Zoll Medical',
                    serialNumber: 'SN-11223-DEF',
                    barcode: 'BC-11223-DEF',
                    categoryId: categories[2].id,
                    hospitalId: hospital.id,
                    locationId: locations[1].id,
                    supplierId: supplier.id,
                    purchaseDate: new Date('2022-01-10'),
                    purchasePrice: 85000,
                    status: 'ACTIVE',
                    condition: 'EXCELLENT',
                    tagNumber: 'TAG-2026-003',
                    maintenanceInterval: 90,
                    calibrationInterval: 180,
                },
            }),
        ])
    } else {
        console.log('ℹ️ Hastane oluşturulmadığı için demo cihazlar atlandı.')
    }

    console.log('✅ Demo cihazlar oluşturuldu:', devices.length)

    console.log('🎉 Seed tamamlandı!')
}

main()
    .catch((e) => {
        console.error('❌ Seed hatası:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
