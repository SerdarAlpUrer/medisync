import { triggerManualBackup } from '../lib/backup-scheduler';
import { prisma } from '../lib/prisma';

async function main() {
    console.log('🔄 Starting manual backup...');
    try {
        await triggerManualBackup();
        console.log('✅ Backup triggered successfully. Check "backups" directory.');
    } catch (error) {
        console.error('❌ Backup failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
