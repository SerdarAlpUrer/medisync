/**
 * SQLite için Admin Kullanıcısı Oluştur
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Creating admin user for SQLite...')

    // Hastane oluştur
    const hospital = await prisma.hospital.upsert({
        where: { code: 'MERKEZ' },
        update: {},
        create: {
            name: 'Merkez Hastane',
            code: 'MERKEZ',
            city: 'İstanbul',
            country: 'TR',
            isActive: true
        }
    })
    console.log('Hospital created:', hospital.name)

    // Admin kullanıcı oluştur
    const hashedPassword = await bcrypt.hash('admin123', 10)

    const admin = await prisma.user.upsert({
        where: { email: 'admin@medisync.local' },
        update: {},
        create: {
            email: 'admin@medisync.local',
            name: 'Admin',
            password: hashedPassword,
            role: 'ADMIN',
            hospitalId: hospital.id,
            isActive: true
        }
    })
    console.log('Admin user created:', admin.email)

    // AppSettings oluştur
    await prisma.appSettings.upsert({
        where: { id: 'default' },
        update: {},
        create: {
            id: 'default',
            maintenanceEnabled: true,
            calibrationEnabled: true,
            contractsEnabled: true,
            reportsEnabled: true
        }
    })
    console.log('App settings created')

    // Demo lisans oluştur
    await prisma.systemLicense.upsert({
        where: { id: 'license' },
        update: {},
        create: {
            id: 'license',
            isDemo: true,
            isActive: true,
            demoDurationHours: 240
        }
    })
    console.log('License created')

    console.log('\n✅ Setup complete!')
    console.log('Login: admin@medisync.local / admin123')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
