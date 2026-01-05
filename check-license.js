const { PrismaClient } = require('@prisma/client');
const { machineId } = require('node-machine-id');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function getDeviceFingerprint() {
    try {
        const id = await machineId()
        return crypto.createHash('md5').update(id).digest('hex').substring(0, 8).toUpperCase()
    } catch (error) {
        return 'UNKNOWN'
    }
}

async function checkLicense() {
    const fingerprint = await getDeviceFingerprint();
    const license = await prisma.systemLicense.findFirst();

    console.log('=== SİSTEM BİLGİSİ ===');
    console.log('Cihaz Kodu (Fingerprint):', fingerprint);
    console.log('----------------------');

    if (license) {
        console.log('=== MEVCUT LİSANS BİLGİSİ ===');
        console.log(JSON.stringify(license, null, 2));

        const now = new Date();
        console.log('\n=== HESAPLAMA ===');
        console.log('Şu an:', now.toLocaleString('tr-TR'));

        if (license.expiryDate) {
            const expiryDate = new Date(license.expiryDate);
            const remainingMs = expiryDate.getTime() - now.getTime();
            const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
            console.log('Lisans Bitiş:', expiryDate.toLocaleString('tr-TR'));
            console.log('Kalan:', remainingHours, 'saat');
            if (remainingMs <= 0) {
                console.log('⚠️ LİSANS SÜRESİ DOLDU!');
            }
        } else if (license.isDemo) {
            const startDate = new Date(license.firstRunDate);
            const endDate = new Date(startDate.getTime() + license.demoDurationHours * 60 * 60 * 1000);
            console.log('Demo Bitiş:', endDate.toLocaleString('tr-TR'));
        } else {
            console.log('Lisans aktif ve süresiz (expiryDate boş)');
        }
    } else {
        console.log('Lisans kaydı bulunamadı (Demo modunda başlayacak)');
    }

    await prisma.$disconnect();
}

checkLicense();
