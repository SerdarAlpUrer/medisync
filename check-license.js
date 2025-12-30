const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLicense() {
    const license = await prisma.systemLicense.findFirst();

    if (license) {
        console.log('=== TAM LİSANS BİLGİSİ ===');
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
        console.log('Lisans kaydı bulunamadı');
    }

    await prisma.$disconnect();
}

checkLicense();
