import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateNextTagNumber } from '@/lib/tag-generator'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { devices, hospitalId } = body

        if (!Array.isArray(devices)) {
            return NextResponse.json(
                { error: 'Geçersiz veri formatı. Cihaz listesi bekleniyor.' },
                { status: 400 }
            )
        }

        // Hedef hastaneyi belirle
        let targetHospital;
        if (hospitalId) {
            targetHospital = await prisma.hospital.findUnique({ where: { id: hospitalId } })
        }

        // Eğer belirtilen hastane yoksa veya gönderilmediyse varsayılanı al
        if (!targetHospital) {
            targetHospital = await prisma.hospital.findFirst()
            if (!targetHospital) {
                targetHospital = await prisma.hospital.create({
                    data: {
                        name: 'Merkez Hastane',
                        code: 'MERKEZ',
                    }
                })
            }
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        }

        // Helper to check if a value is effectively empty
        const isEmpty = (val: any) => {
            if (!val) return true;
            if (typeof val === 'string') {
                const trimmed = val.trim();
                return trimmed === '' || trimmed === '-';
            }
            return false;
        };

        // Robust date parser for Excel Turkish (DD.MM.YYYY), ISO, Excel serial, or Date objects
        const parseSafeDate = (val: any): Date | undefined => {
            if (val === null || val === undefined) return undefined;
            if (val instanceof Date) {
                return isNaN(val.getTime()) ? undefined : val;
            }
            if (typeof val === 'number') {
                if (val > 10000 && val < 100000) {
                    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
                    return isNaN(date.getTime()) ? undefined : date;
                }
                const date = new Date(val);
                return isNaN(date.getTime()) ? undefined : date;
            }
            if (typeof val === 'string') {
                const trimmed = val.trim();
                if (!trimmed || trimmed === '-' || trimmed.toLowerCase() === 'invalid date' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
                    return undefined;
                }

                // Turkish date format DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY
                const trMatch = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
                if (trMatch) {
                    const [, day, month, year, h, m, s] = trMatch;
                    const date = new Date(
                        Date.UTC(
                            parseInt(year, 10),
                            parseInt(month, 10) - 1,
                            parseInt(day, 10),
                            h ? parseInt(h, 10) : 0,
                            m ? parseInt(m, 10) : 0,
                            s ? parseInt(s, 10) : 0
                        )
                    );
                    return isNaN(date.getTime()) ? undefined : date;
                }

                // ISO string or standard parse
                const date = new Date(trimmed);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
            return undefined;
        };

        const parseSafeFloat = (val: any): number | null => {
            if (val === null || val === undefined || val === '' || val === '-') return null;
            if (typeof val === 'number') return isNaN(val) ? null : val;
            const str = String(val).replace(/[^0-9.,-]/g, '').trim();
            if (!str) return null;
            let normalized = str;
            if (str.includes('.') && str.includes(',')) {
                if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
                    normalized = str.replace(/\./g, '').replace(',', '.');
                } else {
                    normalized = str.replace(/,/g, '');
                }
            } else if (str.includes(',')) {
                normalized = str.replace(',', '.');
            }
            const num = parseFloat(normalized);
            return isNaN(num) ? null : num;
        };

        const parseSafeInt = (val: any): number | null => {
            if (val === null || val === undefined || val === '' || val === '-') return null;
            if (typeof val === 'number') return isNaN(val) ? null : Math.round(val);
            const num = parseInt(String(val).replace(/[^0-9-]/g, ''), 10);
            return isNaN(num) ? null : num;
        };

        for (let i = 0; i < devices.length; i++) {
            const deviceData = devices[i];
            const index = i;
            const rowNumber = index + 2; // Excel'de başlık satırı (1) + 0-index offset (1)

            try {
                // 1. İsim Kontrolü
                let deviceName = deviceData.name;

                // İsim boşsa, Kategori ismini kullan (Fallback)
                if (isEmpty(deviceName)) {
                    if (!isEmpty(deviceData.categoryName)) {
                        deviceName = deviceData.categoryName;
                    } else {
                        // İkisi de yoksa atla
                        results.errors.push(`[Satır ${rowNumber}] İsimsiz Cihaz: Cihaz adı veya kategori adı bulunamadı.`)
                        continue;
                    }
                }

                // Normalizasyon: "İ" harfini "I" ile değiştir
                if (typeof deviceName === 'string') {
                    deviceName = deviceName.replace(/İ/g, 'I');
                }

                // 2. Kategori Kontrolü: Yoksa "Diğer" ata
                let categoryId = deviceData.categoryId
                if (!categoryId) {
                    let categoryName = deviceData.categoryName;
                    if (isEmpty(categoryName)) {
                        categoryName = 'Diğer';
                    }

                    const categoryCode = categoryName.toLocaleUpperCase('tr-TR').replace(/\s+/g, '_');
                    const category = await prisma.deviceCategory.upsert({
                        where: { code: categoryCode },
                        update: {},
                        create: {
                            name: categoryName,
                            code: categoryCode,
                        }
                    })
                    categoryId = category.id
                }

                // Lokasyon bul veya oluştur
                let locationId = deviceData.locationId
                if (!locationId && !isEmpty(deviceData.locationName)) {
                    const locationCode = deviceData.locationName.toLocaleUpperCase('tr-TR').replace(/\s+/g, '_');
                    const location = await prisma.location.upsert({
                        where: { code: locationCode },
                        update: {},
                        create: {
                            name: deviceData.locationName,
                            code: locationCode,
                        }
                    })
                    locationId = location.id
                }

                // Tedarikçi bul veya oluştur
                let supplierId = deviceData.supplierId
                if (!supplierId && deviceData.supplierName && deviceData.supplierName !== '-') {
                    const supplierCode = deviceData.supplierName.toLocaleUpperCase('tr-TR').replace(/\s+/g, '_');
                    const supplier = await prisma.supplier.upsert({
                        where: { code: supplierCode },
                        update: {},
                        create: {
                            name: deviceData.supplierName,
                            code: supplierCode,
                        }
                    })
                    supplierId = supplier.id
                }

                // 3. Seri No Kontrolü: Yoksa Otomatik Oluştur
                let serialNumber = deviceData.serialNumber;
                if (serialNumber) {
                    serialNumber = String(serialNumber); // Sayı gelirse string'e çevir
                }

                if (isEmpty(serialNumber)) {
                    const timestamp = Date.now();
                    const random = Math.floor(Math.random() * 1000);
                    serialNumber = `NO-SERIAL-${timestamp}-${random}`;
                }

                // Zorunlu alan kontrolü (Artık Name, Serial ve Category kesin var)
                if (!deviceName || !serialNumber || !categoryId) {
                    // Teorik olarak buraya düşmemeli ama güvenlik için
                    throw new Error(`Kritik hata: ${deviceName} için zorunlu alanlar oluşturulamadı.`)
                }

                // Tag Numarası Kontrolü veya Oluşturma
                let tagNumber = deviceData.tagNumber
                if (!tagNumber || tagNumber === '-' || tagNumber.toString().trim() === '') {
                    tagNumber = await generateNextTagNumber(prisma)
                } else {
                    tagNumber = String(tagNumber) // String'e çevir
                }

                const devicePayload = {
                    name: deviceName,
                    brand: deviceData.brand ? String(deviceData.brand) : null,
                    model: deviceData.model ? String(deviceData.model) : '',
                    manufacturer: deviceData.manufacturer && deviceData.manufacturer !== '-' ? String(deviceData.manufacturer) : null,
                    serialNumber: serialNumber,
                    tagNumber: tagNumber,
                    barcode: deviceData.barcode && deviceData.barcode !== '-' ? String(deviceData.barcode) : null,
                    rfidTag: deviceData.rfidTag && deviceData.rfidTag !== '-' ? String(deviceData.rfidTag) : null,

                    categoryId: categoryId,
                    locationId: locationId,
                    supplierId: supplierId || null,
                    hospitalId: targetHospital.id,

                    status: deviceData.status || 'ACTIVE',
                    condition: deviceData.condition || 'GOOD',

                    purchaseDate: parseSafeDate(deviceData.purchaseDate),
                    purchasePrice: parseSafeFloat(deviceData.purchasePrice),
                    warrantyExpiry: parseSafeDate(deviceData.warrantyExpiry),

                    lastMaintenanceDate: parseSafeDate(deviceData.lastMaintenance || deviceData.lastMaintenanceDate),
                    nextMaintenanceDate: parseSafeDate(deviceData.nextMaintenanceDate),
                    maintenanceInterval: parseSafeInt(deviceData.maintenanceInterval),

                    description: deviceData.description && deviceData.description !== '-' ? String(deviceData.description) : null,
                }

                // Check if device already exists (e.g. re-importing an exported file)
                const existingDevice = await prisma.device.findFirst({
                    where: {
                        OR: [
                            ...(tagNumber ? [{ tagNumber }] : []),
                            ...(serialNumber && deviceName ? [{ name: deviceName, serialNumber }] : [])
                        ]
                    }
                })

                if (existingDevice) {
                    await prisma.device.update({
                        where: { id: existingDevice.id },
                        data: devicePayload
                    })
                } else {
                    await prisma.device.create({
                        data: devicePayload
                    })
                }

                results.success++
            } catch (error: any) {
                const locInfo = deviceData.locationName ? `Bölüm: ${deviceData.locationName}` : 'Bölüm: Yok';
                const serInfo = deviceData.serialNumber ? `S.No: ${deviceData.serialNumber}` : 'S.No: Yok';
                const failPrefix = `[Satır ${rowNumber}] ${deviceData.name || 'İsimsiz'}`;

                // Duplicate Handling (Tag No or Serial No duplication)
                if (error.code === 'P2002') {
                    results.failed++
                    // Hangi alanın duplicate olduğunu anlamaya çalışabiliriz ama genel mesaj yeterli
                    results.errors.push(`${failPrefix}: Bu Seri No veya Künye No ile zaten kayıt var. (${serInfo}, ${locInfo})`)
                } else {
                    console.error('Device import error:', error)
                    results.failed++
                    results.errors.push(`${failPrefix}: ${error.message} (${serInfo}, ${locInfo})`)
                }
            }
        }

        return NextResponse.json({
            message: 'İçe aktarma tamamlandı',
            results
        })

    } catch (error) {
        console.error('Import error:', error)
        return NextResponse.json(
            { error: 'İçe aktarma sırasında bir hata oluştu' },
            { status: 500 }
        )
    }
}
