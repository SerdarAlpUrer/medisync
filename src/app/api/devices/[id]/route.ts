import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/devices/[id] - Belirli bir cihazı getir
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const device = await prisma.device.findUnique({
            where: { id },
            include: {
                category: true,
                location: true,
                hospital: true,
                supplier: true,
                maintenanceRecords: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
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
                        movedByUser: true,
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
            status,
            condition,
            purchaseDate,
            lastMaintenanceDate,
            nextMaintenanceDate,
            warrantyExpiryDate,
            warrantyExpiry,
            purchasePrice,
            description,
            newLocationName,
            newSupplierName,
            productionYear
        } = body

        let finalLocationId = locationId
        let finalSupplierId = supplierId

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
            purchaseDate,
            lastMaintenanceDate,
            nextMaintenanceDate,
            warrantyExpiry: warrantyExpiry || warrantyExpiryDate, // Handle both
            description
        }

        // Handle numeric fields
        if (purchasePrice !== undefined && purchasePrice !== null && purchasePrice !== '') {
            updateData.purchasePrice = parseFloat(purchasePrice.toString())
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

        return NextResponse.json({ message: 'Cihaz başarıyla silindi' })
    } catch (error) {
        console.error('Error deleting device:', error)
        return NextResponse.json(
            { error: 'Cihaz silinirken hata oluştu' },
            { status: 500 }
        )
    }
}
