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

                // Cihazı oluştur
                await prisma.device.create({
                    data: {
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

                        purchaseDate: deviceData.purchaseDate ? new Date(deviceData.purchaseDate) : undefined,
                        purchasePrice: deviceData.purchasePrice && deviceData.purchasePrice !== '-' ? parseFloat(deviceData.purchasePrice) : null,
                        warrantyExpiry: deviceData.warrantyExpiry ? new Date(deviceData.warrantyExpiry) : undefined,

                        lastMaintenanceDate: deviceData.lastMaintenance ? new Date(deviceData.lastMaintenance) : undefined,
                        nextMaintenanceDate: deviceData.nextMaintenanceDate ? new Date(deviceData.nextMaintenanceDate) : undefined,
                        maintenanceInterval: deviceData.maintenanceInterval && deviceData.maintenanceInterval !== '-' ? parseInt(deviceData.maintenanceInterval) : null,

                        description: deviceData.description && deviceData.description !== '-' ? deviceData.description : null,
                    }
                })

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
