import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cache, cacheKeys } from '@/lib/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/devices/[id] - Belirli bir cihazı getir
// Not: QR tarama sayfası (/scan/[id]) oturumsuz erişir; bu durumda yalnızca klinik açıdan gerekli,
// hassas olmayan alanlar döndürülür (fiyat, maliyet, hareket geçmişi ve kullanıcı bilgisi gizlenir).
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        const sessionUser = session?.user as any

        const device = await prisma.device.findUnique({
            where: { id },
            include: {
                category: true,
                location: true,
                hospital: true,
                supplier: true,
                maintenanceRecords: {
                    orderBy: { scheduledDate: 'desc' },
                    take: 50,
                    include: {
                        technician: { select: { id: true, name: true, email: true, phone: true } },
                    },
                },
                workOrders: {
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                    include: {
                        assignedTo: { select: { id: true, name: true, email: true, phone: true } },
                    },
                },
                calibrationRecords: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                movements: {
                    orderBy: { movedAt: 'desc' },
                    take: 10,
                    include: {
                        fromLocation: true,
                        movedByUser: { select: { id: true, name: true, email: true, role: true } },
                    },
                },
            },
        })

        if (!device) {
            return NextResponse.json(
                { error: 'Cihaz bulunamadı' },
                { status: 404 }
            )
        }

        // Çoklu hastane izolasyonu: başka hastanenin cihazında yalnızca herkese açık özet gösterilir
        const isOtherTenant = !!(sessionUser?.hospitalId && device.hospitalId && sessionUser.hospitalId !== device.hospitalId)

        if (!sessionUser || isOtherTenant) {
            const lastCal = device.calibrationRecords?.[0]
            return NextResponse.json({
                id: device.id,
                name: device.name,
                brand: device.brand,
                model: device.model,
                serialNumber: device.serialNumber,
                tagNumber: device.tagNumber,
                status: device.status,
                condition: (device as any).condition,
                description: device.description,
                lastMaintenanceDate: device.lastMaintenanceDate,
                nextMaintenanceDate: device.nextMaintenanceDate,
                lastCalibrationDate: device.lastCalibrationDate,
                nextCalibrationDate: device.nextCalibrationDate,
                warrantyExpiry: device.warrantyExpiry,
                category: device.category ? { id: device.category.id, name: device.category.name, group: (device.category as any).group } : null,
                location: device.location ? { name: device.location.name } : null,
                hospital: device.hospital ? { name: device.hospital.name } : null,
                supplier: device.supplier ? { name: device.supplier.name, phone: (device.supplier as any).phone } : null,
                calibrationRecords: lastCal ? [{ result: (lastCal as any).result, certificateNumber: (lastCal as any).certificateNumber }] : [],
            })
        }

        return NextResponse.json(device)
    } catch (error) {
        console.error('Error fetching device:', error)
        return NextResponse.json(
            { error: 'Cihaz yüklenirken hata oluştu' },
            { status: 500 }
        )
    }
}

// PUT /api/devices/[id] - Cihaz güncelle
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        // Extract fields
        const {
            name,
            brand,
            model,
            serialNumber,
            tagNumber,
            barcode,
            rfidTag,
            manufacturer,
            locationId,
            supplierId,
            categoryId,
            status,
            condition,
            purchaseDate,
            lastMaintenanceDate,
            nextMaintenanceDate,
            lastCalibrationDate,
            nextCalibrationDate,
            warrantyExpiryDate,
            warrantyExpiry,
            purchasePrice,
            maintenanceInterval,
            calibrationInterval,
            description,
            newLocationName,
            newSupplierName,
            productionYear
        } = body

        let finalLocationId = locationId || null
        let finalSupplierId = supplierId || null

        // Handle new Location creation
        if (newLocationName) {
            const code = `LOC-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
            const newLocation = await prisma.location.create({
                data: {
                    name: newLocationName,
                    code: code
                }
            })
            finalLocationId = newLocation.id
        }

        // Handle new Supplier creation
        if (newSupplierName) {
            const code = `SUP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
            const newSupplier = await prisma.supplier.create({
                data: {
                    name: newSupplierName,
                    code: code
                }
            })
            finalSupplierId = newSupplier.id
        }

        const parseOptionalDate = (val: any): Date | null | undefined => {
            if (val === undefined) return undefined
            if (val === null || val === '') return null
            const d = new Date(val)
            return isNaN(d.getTime()) ? null : d
        }

        // Prepare update data
        const updateData: any = {
            name,
            brand,
            model,
            serialNumber,
            tagNumber,
            barcode,
            rfidTag,
            manufacturer,
            locationId: finalLocationId,
            supplierId: finalSupplierId,
            status,
            condition,
            purchaseDate: parseOptionalDate(purchaseDate),
            lastMaintenanceDate: parseOptionalDate(lastMaintenanceDate),
            nextMaintenanceDate: parseOptionalDate(nextMaintenanceDate),
            lastCalibrationDate: parseOptionalDate(lastCalibrationDate),
            nextCalibrationDate: parseOptionalDate(nextCalibrationDate),
            warrantyExpiry: parseOptionalDate(warrantyExpiry !== undefined ? warrantyExpiry : warrantyExpiryDate),
            description
        }

        if (categoryId) {
            updateData.categoryId = categoryId
        }

        // Handle numeric fields
        if (purchasePrice !== undefined) {
            updateData.purchasePrice = purchasePrice === null || purchasePrice === '' ? null : parseFloat(purchasePrice.toString())
        }
        if (maintenanceInterval !== undefined) {
            updateData.maintenanceInterval = maintenanceInterval === null || maintenanceInterval === '' ? null : parseInt(maintenanceInterval.toString(), 10)
        }
        if (calibrationInterval !== undefined) {
            updateData.calibrationInterval = calibrationInterval === null || calibrationInterval === '' ? null : parseInt(calibrationInterval.toString(), 10)
        }
        if (productionYear !== undefined) {
            updateData.productionYear = productionYear === null || productionYear === '' ? null : parseInt(productionYear.toString(), 10)
        }

        const device = await prisma.device.update({
            where: { id },
            data: updateData,
            include: {
                category: true,
                location: true,
                hospital: true,
                supplier: true,
            },
        })

        cache.delete(cacheKeys.devices('*'))
        cache.delete('dashboard:*')

        return NextResponse.json(device)
    } catch (error: any) {
        console.error('Error updating device:', error)

        // Handle Unique Constraint Violation
        if (error.code === 'P2002') {
            const target = error.meta?.target
            if (Array.isArray(target) && target.includes('serialNumber') && target.includes('name')) {
                return NextResponse.json(
                    { error: 'Bu cihaz türü için bu seri numarası zaten kayıtlı.' },
                    { status: 409 }
                )
            }
        }

        return NextResponse.json(
            { error: 'Cihaz güncellenirken hata oluştu' },
            { status: 500 }
        )
    }
}

// DELETE /api/devices/[id] - Cihaz sil
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await prisma.device.delete({
            where: { id },
        })

        cache.delete(cacheKeys.devices('*'))
        cache.delete('dashboard:*')

        return NextResponse.json({ message: 'Cihaz başarıyla silindi' })
    } catch (error) {
        console.error('Error deleting device:', error)
        return NextResponse.json(
            { error: 'Cihaz silinirken hata oluştu' },
            { status: 500 }
        )
    }
}
