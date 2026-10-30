const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres@localhost:5432/medisync_test?schema=public"
        }
    }
});

async function main() {
    const hash = await bcrypt.hash('admin123', 10);
    const emails = ['admin@medisync.com', 'admin@biomedicapp.com', 'supervisor@medisync.com'];
    for (const email of emails) {
        await prisma.user.upsert({
            where: { email },
            update: { password: hash, isActive: true, role: 'ADMIN', failedLoginAttempts: 0 },
            create: { email, name: 'Sistem Yöneticisi', password: hash, isActive: true, role: 'ADMIN' }
        });
    }
    console.log('✅ Medisync Test Admin hesapları hazırlandı.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
