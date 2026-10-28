import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateNextTagNumber } from '@/lib/tag-generator'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { deviceId, calibration, unmatchedId, createDevice } = body

        if ((!deviceId && !createDevice) || !calibration) {
            return NextResponse.json(
                { error: 'Cihaz ID ve kalibrasyon verisi gereklidir' },
                { status: 400 }
            )
        }

        let targetDeviceId = deviceId

        // Handle Force Save (Create Device)
        if (createDevice) {
            // Check if device already exists
            const existingDevice = await prisma.device.findFirst({
                where: { serialNumber: calibration.deviceSerialNumber }
            })

            if (existingDevice) {
                targetDeviceId = existingDevice.id
            } else {
                // Get hospital (from request or default)
                let hospitalId = body.hospitalId

                if (!hospitalId) {
                    const hospital = await prisma.hospital.findFirst()
                    hospitalId = hospital?.id
                }

                if (!hospitalId) {
                    return NextResponse.json(
                        { error: 'Sistemde kayıtlı hastane bulunamadı' },
                        { status: 400 }
                    )
                }

                // Get default category
                const category = await prisma.deviceCategory.findFirst()
                if (!category) {
                    return NextResponse.json(
                        { error: 'Sistemde kayıtlı kategori bulunamadı' },
                        { status: 400 }
                    )
                }

                // Create new device
                try {
                    // Generate sequential tag number
                    const tagNumber = calibration.tagNumber || await generateNextTagNumber(prisma)

                    // Find or create location if provided
                    let locationId = null
                    if (calibration.location) {
                        const locationName = calibration.location
                        const code = locationName.toUpperCase().replace(/\s+/g, '_').replace(/İ/g, 'I').replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ş/g, 'S').replace(/Ö/g, 'O').replace(/Ç/g, 'C')

                        const location = await prisma.location.upsert({
                            where: { code },
                            update: {},
                            create: {
                                name: locationName,
                                code
                            }
                        })
                        locationId = location.id
                    }

                    const newDevice = await prisma.device.create({
                        data: {
                            name: calibration.deviceName || 'Bilinmeyen Cihaz',
                            brand: calibration.brand,
                            model: calibration.model || 'Bilinmeyen Model',
                            serialNumber: (['-', 'N/A', 'YOK', 'UNKNOWN', ''].includes(calibration.deviceSerialNumber?.toUpperCase() || '') || (calibration.deviceSerialNumber?.length || 0) < 3)
                                ? tagNumber
                                : calibration.deviceSerialNumber,
                            tagNumber: tagNumber,
                            hospitalId: hospitalId,
                            categoryId: category.id,
                            status: 'ACTIVE',
                            locationId: locationId
                        }
                    })
                    targetDeviceId = newDevice.id
                } catch (error) {
                    console.error('Error creating device for calibration:', error)
                    return NextResponse.json(
                        { error: 'Otomatik cihaz oluşturma başarısız oldu' },
                        { status: 500 }
                    )
                }
            }
        }

        // Find device
        const device = await prisma.device.findUnique({
            where: { id: targetDeviceId },
            include: { hospital: true }
        })

        if (!device) {
            return NextResponse.json(
                { error: 'Cihaz bulunamadı' },
                { status: 404 }
            )
        }

        // Find technician by name (optional)
        let technicianId: string | undefined
        if (calibration.technicianName) {
            const technician = await prisma.user.findFirst({
                where: {
                    name: {
                        contains: calibration.technicianName
                    },
                    role: 'TECHNICIAN'
                }
            })
            technicianId = technician?.id
        }

        // Create calibration record
        const newCalibration = await prisma.calibrationRecord.create({
            data: {
                deviceId: device.id,
                hospitalId: device.hospitalId,
                scheduledDate: new Date(calibration.scheduledDate),
                completedDate: calibration.completedDate ? new Date(calibration.completedDate) : undefined,
                expiryDate: calibration.expiryDate ? new Date(calibration.expiryDate) : undefined,
                status: calibration.status,
                result: calibration.result,
                calibrationLab: calibration.calibrationLab,
                certificateNumber: calibration.certificateNumber,
                technicianId,
                cost: calibration.cost,
            },
            include: {
                device: {
                    include: {
                        location: true
                    }
                },
                hospital: true,
                technician: { select: { id: true, name: true, email: true, role: true, department: true, phone: true } },
            }
        })

        // Update device's last calibration date if completed
        if (calibration.completedDate) {
            await prisma.device.update({
                where: { id: device.id },
                data: {
                    lastCalibrationDate: new Date(calibration.completedDate),
                    nextCalibrationDate: calibration.expiryDate ? new Date(calibration.expiryDate) : undefined
                }
            })
        }

        // Delete from UnmatchedCalibration if unmatchedId is provided
        if (unmatchedId) {
            try {
                await prisma.unmatchedCalibration.delete({
                    where: { id: unmatchedId }
                })
            } catch (error) {
                console.error('Error deleting unmatched calibration:', error)
                // Don't fail the request if deletion fails, just log it
            }
        }

        return NextResponse.json(newCalibration, { status: 201 })
    } catch (error) {
        console.error('Error creating matched calibration:', error)
        return NextResponse.json(
            { error: 'Kalibrasyon kaydı oluşturulurken hata oluştu' },
            { status: 500 }
        )
    }
}
