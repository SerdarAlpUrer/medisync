import { restoreDatabaseFromJson } from '../lib/database-utils';
import { prisma } from '../lib/prisma';
import fs from 'fs/promises';
import path from 'path';

async function main() {
    const backupFile = process.argv[2];

    if (!backupFile) {
        console.error('❌ Please provide backup file path');
        console.error('Usage: npm run db:restore <path/to/backup.json>');
        process.exit(1);
    }

    try {
        const absolutePath = path.isAbsolute(backupFile)
            ? backupFile
            : path.join(process.cwd(), backupFile);

        console.log(`📖 Reading backup file: ${absolutePath}`);

        const fileContent = await fs.readFile(absolutePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);

        console.log('🔄 Starting restoration...');
        await restoreDatabaseFromJson(jsonData);

        console.log('✅ Database restored successfully');

    } catch (error) {
        console.error('❌ Restore failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
