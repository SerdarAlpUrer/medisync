import { PrismaClient } from '@prisma/client'

export async function generateNextTagNumber(prisma: PrismaClient | any, hospitalId?: string | null) {
    // Get settings
    let settings = await prisma.appSettings.findUnique({
        where: { id: "default" }
    });

    let format = (settings as any)?.deviceTagFormat;

    // Fallback: If deviceTagFormat is missing from object (old client), fetch via raw SQL
    if (format === undefined) {
        try {
            const rawResult: any[] = await prisma.$queryRaw`SELECT "deviceTagFormat" FROM "app_settings" WHERE id = 'default'`
            if (rawResult.length > 0 && rawResult[0].deviceTagFormat) {
                format = rawResult[0].deviceTagFormat
            }
        } catch (e) {
            console.warn("Raw settings fetch failed", e)
        }
    }

    if (!format || typeof format !== 'string' || format.trim() === '') {
        format = 'KUNYE-{YYYY}-{SEQ}';
    }

    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentShortYear = currentYear.substring(2);
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const currentDay = now.getDate().toString().padStart(2, '0');

    // Hospital code resolution
    let hospCode = 'HSP';
    if (hospitalId) {
        try {
            const hosp = await prisma.hospital.findUnique({
                where: { id: hospitalId },
                select: { code: true, name: true }
            });
            if (hosp) {
                if (hosp.code) {
                    const parts = hosp.code.split('-');
                    hospCode = (parts[0] || hosp.code).toUpperCase();
                } else if (hosp.name) {
                    hospCode = hosp.name.substring(0, 4).toUpperCase();
                }
            }
        } catch { }
    }

    // Determine sequence padding: e.g. {SEQ:5} or default {SEQ} (4 digits)
    let padLength = 4;
    const customSeqMatch = format.match(/\{SEQ:(\d+)\}/i);
    let seqPlaceholder = '{SEQ}';
    if (customSeqMatch) {
        seqPlaceholder = customSeqMatch[0];
        padLength = parseInt(customSeqMatch[1], 10) || 4;
    }

    // Replace variables in format except sequence placeholder
    let prefix = format
        .replace(/\{YYYY\}/gi, currentYear)
        .replace(/\{YY\}/gi, currentShortYear)
        .replace(/\{MM\}/gi, currentMonth)
        .replace(/\{DD\}/gi, currentDay)
        .replace(/\{HOSP\}/gi, hospCode)
        .replace(/\{KURUM\}/gi, hospCode)
        .replace(/\{CODE\}/gi, hospCode);

    // If no sequence placeholder found, append {SEQ} to end
    if (!prefix.includes(seqPlaceholder)) {
        prefix = `${prefix}-${seqPlaceholder}`;
    }

    // Current prefix is the part BEFORE the sequence placeholder
    const searchPrefix = prefix.substring(0, prefix.indexOf(seqPlaceholder));

    const whereCondition: any = {
        tagNumber: {
            startsWith: searchPrefix
        }
    };
    if (hospitalId) {
        whereCondition.hospitalId = hospitalId;
    }

    const lastDevice = await prisma.device.findFirst({
        where: whereCondition,
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

    // Pad with zeros
    const sequenceStr = nextSequence.toString().padStart(padLength, '0');

    // Final assembly
    return prefix.replace(seqPlaceholder, sequenceStr);
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
