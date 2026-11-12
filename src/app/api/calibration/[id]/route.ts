import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT /api/calibration/[id] - Update a calibration record
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await request.json()
        const { id } = await params

        const calibration = await prisma.calibrationRecord.update({
            where: { id },
            data: {
                status: body.status,
                scheduledDate: new Date(body.scheduledDate),
                completedDate: body.completedDate ? new Date(body.completedDate) : null,
                expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
                calibrationLab: body.calibrationLab,
                technicianId: body.technicianId,
                cost: body.cost ? parseFloat(body.cost) : null,
                result: body.result,
                certificateNumber: body.certificateNumber,
            },
        })

        // Check if we need to update the device's last/next calibration dates
        // This logic can be complex depending on if this is the *latest* calibration
        // For simplicity, if this calibration is completed, we update the device
        if (body.completedDate || body.expiryDate) {
            await prisma.device.update({
                where: { id: calibration.deviceId },
                data: {
                    lastCalibrationDate: body.completedDate ? new Date(body.completedDate) : undefined,
                    nextCalibrationDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
                },
            })
        }

        return NextResponse.json(calibration)
    } catch (error) {
        console.error('Error updating calibration record:', error)
        return NextResponse.json(
            { error: 'Kalibrasyon kaydı güncellenirken hata oluştu' },
            { status: 500 }
        )
    }
}

// DELETE /api/calibration/[id] - Delete a calibration record
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Get the calibration to find the device ID before deleting
        const calibration = await prisma.calibrationRecord.findUnique({
            where: { id },
            select: { deviceId: true }
        })

        if (!calibration) {
            return NextResponse.json(
                { error: 'Kalibrasyon kaydı bulunamadı' },
                { status: 404 }
            )
        }

        await prisma.calibrationRecord.delete({
            where: { id },
        })

        // Ideally, we should recalculate the device's last/next calibration dates
        // by finding the *new* latest completed calibration.
        // For now, we'll leave it as is, or we could fetch the latest one.

        const latestCalibration = await prisma.calibrationRecord.findFirst({
            where: {
                deviceId: calibration.deviceId,
                status: 'COMPLETED'
            },
            orderBy: {
                completedDate: 'desc'
            }
        })

        if (latestCalibration) {
            await prisma.device.update({
                where: { id: calibration.deviceId },
                data: {
                    lastCalibrationDate: latestCalibration.completedDate,
                    nextCalibrationDate: latestCalibration.expiryDate,
                },
            })
        } else {
            // No completed calibrations left
            await prisma.device.update({
                where: { id: calibration.deviceId },
                data: {
                    lastCalibrationDate: null,
                    nextCalibrationDate: null,
                },
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting calibration record:', error)
        return NextResponse.json(
            { error: 'Kalibrasyon kaydı silinirken hata oluştu' },
            { status: 500 }
        )
    }
}
