import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import readline from 'readline'

const prisma = new PrismaClient()

function ask(question: string, defaultValue: string = ''): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `

    return new Promise(resolve => {
        rl.question(prompt, answer => {
            rl.close()
            resolve(answer.trim() || defaultValue)
        })
    })
}

async function main() {
    console.log('\n========================================================')
    console.log('    MediSync - Yeni Müşteri & Hastane İlk Kurulumu')
    console.log('========================================================\n')
    console.log('Bu sihirbaz, yeni müşteri için temiz bir veritabanı hazırlar,')
    console.log('standart biyomedikal kategorilerini ve lokasyonlarını yükler,')
    console.log('ve hastane için ana yönetici hesabını oluşturur.\n')

    const hospitalName = await ask('1. Hastane / Kurum Tam Adı', 'Özel Sağlık Hastanesi')
    const hospitalCode = await ask('2. Kurum Kodu (Benzersiz kısa kod)', 'HOSP-' + Math.floor(1000 + Math.random() * 9000))
    const adminEmail = await ask('3. Baş Biyomedikal / Sistem Yöneticisi E-posta', 'biyomedikal@hastane.com')
    const adminName = await ask('4. Yönetici Adı Soyadı', 'Biyomedikal Sorumlusu')
    const adminPass = await ask('5. Yönetici Şifresi', 'Admin2026!')

    console.log('\n[*] Yapılandırma başlatılıyor...\n')

    // 1. AppSettings oluştur/güncelle (Tüm modüller aktif)
    const settings = await prisma.appSettings.upsert({
        where: { id: 'default' },
        update: {
            maintenanceEnabled: true,
            calibrationEnabled: true,
            contractsEnabled: true,
            utsEnabled: false,
            complianceEnabled: false,
            reportsEnabled: true,
            branchesEnabled: false,
            trainingEnabled: false,
            procurementEnabled: false,
            decommissioningEnabled: false,
            backupAuto: true,
            backupSchedule: 'daily',
            backupRetention: 30,
            deviceTagFormat: 'KUNYE-{YYYY}-{SEQ}'
        },
        create: {
            id: 'default',
            maintenanceEnabled: true,
            calibrationEnabled: true,
            contractsEnabled: true,
            utsEnabled: false,
            complianceEnabled: false,
            reportsEnabled: true,
            branchesEnabled: false,
            trainingEnabled: false,
            procurementEnabled: false,
            decommissioningEnabled: false,
            backupAuto: true,
            backupSchedule: 'daily',
            backupRetention: 30,
            deviceTagFormat: 'KUNYE-{YYYY}-{SEQ}'
        }
    })
    console.log('✅ Klinik modüller ve otomatik yedekleme aktif edildi.')

    // 2. Hastane oluştur
    const hospital = await prisma.hospital.upsert({
        where: { code: hospitalCode },
        update: { name: hospitalName },
        create: {
            name: hospitalName,
            code: hospitalCode,
            country: 'TR',
            isActive: true
        }
    })
    console.log(`✅ Hastane oluşturuldu: ${hospital.name} (${hospital.code})`)

    // 3. Admin Kullanıcısı oluştur
    const hashedPassword = await bcrypt.hash(adminPass, 10)
    const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            name: adminName,
            password: hashedPassword,
            hospitalId: hospital.id,
            role: 'ADMIN',
            isActive: true
        },
        create: {
            email: adminEmail,
            name: adminName,
            password: hashedPassword,
            hospitalId: hospital.id,
            role: 'ADMIN',
            department: 'Biyomedikal Mühendisliği',
            isActive: true
        }
    })
    console.log(`✅ Yönetici hesabı oluşturuldu: ${adminUser.email}`)

    // 4. Standart Tıbbi Cihaz Kategorileri
    const standardCategories = [
        { name: 'Anestezi ve Solunum Ekipmanları', code: 'CAT-ANE', group: 'Yaşam Destek', description: 'Ventilatör, anestezi cihazları, buharlaştırıcılar' },
        { name: 'Ameliyathane Ekipmanları', code: 'CAT-AML', group: 'Cerrahi', description: 'Elektrokoter, ameliyat masası ve lambaları, aspiratörler' },
        { name: 'Tıbbi Görüntüleme & Radyoloji', code: 'CAT-RAD', group: 'Görüntüleme', description: 'MR, BT, Röntgen, C kollu skopi, Mamografi' },
        { name: 'Ultrasonografi Sistemleri', code: 'CAT-USG', group: 'Görüntüleme', description: 'Doppler, Eko ve Genel USG cihazları' },
        { name: 'Yoğun Bakım ve Hasta Başı Monitörleri', code: 'CAT-ICU', group: 'Monitörizasyon', description: 'Multi-parametre hasta başı monitörleri, santral istasyonlar' },
        { name: 'Kardiyoloji & Defibrilatörler', code: 'CAT-KRD', group: 'Kardiyoloji', description: 'Bifazik defibrilatörler, EKG cihazları, efor testleri' },
        { name: 'İnfüzyon & Sıvı İletim Sistemleri', code: 'CAT-INF', group: 'Klinik', description: 'Volumetrik infüzyon pompaları, enjektör perfüzörleri' },
        { name: 'Merkez Laboratuvar Cihazları', code: 'CAT-LAB', group: 'Laboratuvar', description: 'Biyokimya, hemogram ve hormon otoanalizörleri' },
        { name: 'Sterilizasyon & Dezenfeksiyon', code: 'CAT-STR', group: 'Sterilizasyon', description: 'Buharlı otoklav, plazma sterilizatör, yıkama cihazları' },
        { name: 'Diyaliz Ekipmanları', code: 'CAT-DIA', group: 'Nefroloji', description: 'Hemodiyaliz ve su arıtma sistemleri' }
    ]

    for (const cat of standardCategories) {
        await prisma.deviceCategory.upsert({
            where: { code: cat.code },
            update: { name: cat.name, group: cat.group, description: cat.description },
            create: cat
        })
    }
    console.log(`✅ ${standardCategories.length} adet standart biyomedikal kategorisi yüklendi.`)

    // 5. Standart Hastane Lokasyonları
    const standardLocations = [
        { name: 'Acil Servis - Kırmızı Alan', code: 'LOC-ACIL-KIRMIZI', building: 'Ana Bina', floor: 'Zemin', room: 'Z-12' },
        { name: 'Acil Servis - Sarı Alan', code: 'LOC-ACIL-SARI', building: 'Ana Bina', floor: 'Zemin', room: 'Z-15' },
        { name: 'Ameliyathane Salon 1', code: 'LOC-AML-01', building: 'Cerrahi Blok', floor: '1. Kat', room: 'C-101' },
        { name: 'Ameliyathane Salon 2', code: 'LOC-AML-02', building: 'Cerrahi Blok', floor: '1. Kat', room: 'C-102' },
        { name: 'Genel Yoğun Bakım Ünitesi', code: 'LOC-ICU-GENEL', building: 'Ana Bina', floor: '2. Kat', room: 'YB-201' },
        { name: 'Koroner Yoğun Bakım Ünitesi', code: 'LOC-ICU-KORONER', building: 'Kardiyoloji Blok', floor: '2. Kat', room: 'KYB-205' },
        { name: 'Kardiyovasküler Cerrahi (KVC) YB', code: 'LOC-ICU-KVC', building: 'Cerrahi Blok', floor: '2. Kat', room: 'KVC-210' },
        { name: 'Yenidoğan Yoğun Bakım (YYBÜ)', code: 'LOC-ICU-NEONATAL', building: 'Kadın Doğum Blok', floor: '3. Kat', room: 'YYB-301' },
        { name: 'Radyoloji & Görüntüleme Merkezi', code: 'LOC-RAD-01', building: 'Ana Bina', floor: '-1. Kat', room: 'RAD-05' },
        { name: 'Merkez Biyokimya Laboratuvarı', code: 'LOC-LAB-BIO', building: 'Laboratuvar Blok', floor: 'Zemin', room: 'LAB-01' },
        { name: 'Biyomedikal Teknik Atölyesi', code: 'LOC-BM-ATOLYE', building: 'Teknik Servis', floor: '-1. Kat', room: 'BM-01' }
    ]

    for (const loc of standardLocations) {
        await prisma.location.upsert({
            where: { code: loc.code },
            update: { name: loc.name, building: loc.building, floor: loc.floor, room: loc.room },
            create: loc
        })
    }
    console.log(`✅ ${standardLocations.length} adet standart hastane servis/bölüm lokasyonu yüklendi.`)

    console.log('\n========================================================')
    console.log('         KURULUM BAŞARIYLA TAMAMLANDI!')
    console.log('========================================================')
    console.log(`Hastane: ${hospital.name}`)
    console.log(`Yönetici Giriş E-posta: ${adminUser.email}`)
    console.log(`Yönetici Şifre: ${adminPass}`)
    console.log('Uygulama Adresi: http://localhost:3000')
    console.log('========================================================\n')
}

main()
    .catch(e => {
        console.error('Hata:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
