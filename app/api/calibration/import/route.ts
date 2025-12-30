import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface ImportCalibrationData {
    deviceSerialNumber: string
    tagNumber?: string
    deviceName?: string
    brand?: string
    model?: string
    location?: string
    calibrationLab?: string
    scheduledDate: string
    completedDate?: string
    expiryDate?: string
    technicianName?: string
    status: string
    result?: string
    certificateNumber?: string
    cost?: number
}

export interface ImportResult {
    success: boolean
    successCount: number
    errorCount: number
    unmatchedCount: number
    errors: Array<{
        row: number
        serialNumber: string
        message: string
    }>
    // unmatched: ImportCalibrationData[] // Removed, now stored in DB
}

// POST /api/calibration/import - Bulk import calibration records
export async function POST(request: Request) {
    try {
        const { calibrations, hospitalId } = await request.json() as {
            calibrations: ImportCalibrationData[]
            hospitalId?: string
        }

        if (!Array.isArray(calibrations) || calibrations.length === 0) {
            return NextResponse.json(
                { error: 'Kalibrasyon verileri bulunamadı' },
                { status: 400 }
            )
        }

        const results: ImportResult = {
            success: true,
            successCount: 0,
            errorCount: 0,
            unmatchedCount: 0,
            errors: [],
        }

        // Process each calibration record
        for (let i = 0; i < calibrations.length; i++) {
            const cal = calibrations[i]
            const rowNumber = i + 2 // Excel row number (1-indexed + header)

            try {
                // Find device by serial number first
                let device = null

                if (cal.deviceSerialNumber) {
                    device = await prisma.device.findFirst({
                        where: { serialNumber: cal.deviceSerialNumber },
                        include: { hospital: true }
                    })
                }

                // If not found by serial number, try tag number
                if (!device && cal.tagNumber) {
                    device = await prisma.device.findFirst({
                        where: { tagNumber: cal.tagNumber },
                        include: { hospital: true }
                    })
                }

                if (!device) {
                    // Check if already exists in unmatched
                    const existingUnmatched = await prisma.unmatchedCalibration.findFirst({
                        where: {
                            OR: [
                                // Only check serial number if it's valid (not empty, not "-", not "N/A")
                                cal.deviceSerialNumber && cal.deviceSerialNumber.length > 2 && !['-', 'N/A', 'YOK'].includes(cal.deviceSerialNumber.toUpperCase())
                                    ? { deviceSerialNumber: cal.deviceSerialNumber }
                                    : undefined,
                                // Only check tag number if it's valid
                                cal.tagNumber ? { tagNumber: cal.tagNumber } : undefined
                            ].filter(Boolean) as any // Filter out undefined values
                        }
                    })

                    if (existingUnmatched) {
                        // Skip if already exists
                        continue
                    }

                    // Save to UnmatchedCalibration table
                    await prisma.unmatchedCalibration.create({
                        data: {
                            deviceSerialNumber: cal.deviceSerialNumber,
                            tagNumber: cal.tagNumber,
                            deviceName: cal.deviceName,
                            brand: cal.brand,
                            model: cal.model,
                            location: cal.location,
                            hospitalId: hospitalId, // Store hospital ID for filtering
                            calibrationLab: cal.calibrationLab,
                            scheduledDate: new Date(cal.scheduledDate),
                            completedDate: cal.completedDate ? new Date(cal.completedDate) : undefined,
                            expiryDate: cal.expiryDate ? new Date(cal.expiryDate) : undefined,
                            technicianName: cal.technicianName,
                            status: cal.status,
                            result: cal.result,
                            certificateNumber: cal.certificateNumber,
                            cost: cal.cost,
                        }
                    })
                    results.unmatchedCount++
                    continue
                }

                // Find technician by name (optional)
                let technicianId: string | undefined
                if (cal.technicianName) {
                    const technician = await prisma.user.findFirst({
                        where: {
                            name: {
                                contains: cal.technicianName
                            },
                            role: 'TECHNICIAN'
                        }
                    })
                    technicianId = technician?.id
                }

                // Create calibration record
                const calibration = await prisma.calibrationRecord.create({
                    data: {
                        deviceId: device.id,
                        hospitalId: hospitalId || device.hospitalId,
                        scheduledDate: new Date(cal.scheduledDate),
                        completedDate: cal.completedDate ? new Date(cal.completedDate) : undefined,
                        expiryDate: cal.expiryDate ? new Date(cal.expiryDate) : undefined,
                        status: cal.status,
                        result: cal.result,
                        calibrationLab: cal.calibrationLab,
                        certificateNumber: cal.certificateNumber,
                        technicianId,
                        cost: cal.cost,
                    }
                })

                // Update device's last calibration date if completed
                if (cal.completedDate) {
                    await prisma.device.update({
                        where: { id: device.id },
                        data: {
                            lastCalibrationDate: new Date(cal.completedDate),
                            nextCalibrationDate: cal.expiryDate ? new Date(cal.expiryDate) : undefined
                        }
                    })
                }

                results.successCount++
            } catch (error) {
                console.error(`Error importing calibration for ${cal.deviceSerialNumber}:`, error)
                results.errors.push({
                    row: rowNumber,
                    serialNumber: cal.deviceSerialNumber || cal.tagNumber || 'Unknown',
                    message: `Kayıt oluşturma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
                })
                results.errorCount++
            }
        }

        results.success = results.errorCount === 0

        return NextResponse.json(results, {
            status: results.success ? 201 : 207 // 207 Multi-Status for partial success
        })
    } catch (error) {
        console.error('Error in bulk calibration import:', error)
        return NextResponse.json(
            { error: 'Toplu import işlemi başarısız oldu' },
            { status: 500 }
        )
    }
}
