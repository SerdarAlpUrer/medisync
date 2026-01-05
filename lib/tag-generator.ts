import { PrismaClient } from '@prisma/client'

export async function generateNextTagNumber(prisma: PrismaClient | any) {
    // Get settings
    let settings = await prisma.appSettings.findUnique({
        where: { id: "default" }
    });

    let format = (settings as any)?.deviceTagFormat;

    // Fallback: If deviceTagFormat is missing from object (old client), fetch via raw SQL
    if (format === undefined) {
        try {
            // SQLite uyumlu sözdizimi
            const rawResult: any[] = await prisma.$queryRaw`SELECT deviceTagFormat FROM app_settings WHERE id = 'default'`
            if (rawResult.length > 0 && rawResult[0].deviceTagFormat) {
                format = rawResult[0].deviceTagFormat
            }
        } catch (e) {
            console.warn("Raw settings fetch failed", e)
        }
    }

    if (!format) {
        format = 'TAG-{YYYY}-{SEQ}';
    }

    const currentYear = new Date().getFullYear().toString();
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');

    // Replace variables in format except {SEQ}
    // We treat {SEQ} as the placeholder we need to fill
    let prefix = format
        .replace('{YYYY}', currentYear)
        .replace('{MM}', currentMonth);

    // Find where {SEQ} starts
    const seqIndex = prefix.indexOf('{SEQ}');

    // If no {SEQ} placeholder, append it to end by default
    if (seqIndex === -1) {
        prefix = `${prefix}-{SEQ}`;
    }

    // Current prefix is the part BEFORE {SEQ}
    const searchPrefix = prefix.substring(0, prefix.indexOf('{SEQ}'));

    const lastDevice = await prisma.device.findFirst({
        where: {
            tagNumber: {
                startsWith: searchPrefix
            }
        },
        orderBy: {
            tagNumber: 'desc'
        },
        select: {
            tagNumber: true
        }
    });

    let nextSequence = 1;

    if (lastDevice && lastDevice.tagNumber) {
        // Extract the sequence number
        const val = lastDevice.tagNumber.substring(searchPrefix.length);
        const match = val.match(/^(\d+)/);
        if (match) {
            const lastSeq = parseInt(match[1], 10);
            if (!isNaN(lastSeq)) {
                nextSequence = lastSeq + 1;
            }
        }
    }

    // Pad with zeros to 4 digits
    const sequenceStr = nextSequence.toString().padStart(4, '0');

    // Final assembly
    return prefix.replace('{SEQ}', sequenceStr);
}

export async function generateWorkOrderNumber(prisma: PrismaClient | any) {
    const currentYear = new Date().getFullYear();
    const prefix = `WO-${currentYear}-`;

    const lastOrder = await prisma.workOrder.findFirst({
        where: {
            workOrderNumber: {
                startsWith: prefix
            }
        },
        orderBy: {
            workOrderNumber: 'desc'
        },
        select: {
            workOrderNumber: true
        }
    });

    let nextSequence = 1;

    if (lastOrder && lastOrder.workOrderNumber) {
        const parts = lastOrder.workOrderNumber.split('-');
        if (parts.length === 3) {
            const lastSequence = parseInt(parts[2], 10);
            if (!isNaN(lastSequence)) {
                nextSequence = lastSequence + 1;
            }
        }
    }

    const sequenceStr = nextSequence.toString().padStart(4, '0');
    return `${prefix}${sequenceStr}`;
}
