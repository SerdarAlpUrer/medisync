import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/calibration - Tüm kalibrasyon kayıtlarını listele
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const deviceId = searchParams.get('deviceId')
        const hospitalId = searchParams.get('hospitalId')

        const where: any = {}

        if (status && status !== 'ALL') {
            where.status = status
        }
        if (deviceId) {
            where.deviceId = deviceId
        }
        if (hospitalId) {
            where.hospitalId = hospitalId
        }

        const calibrations = await prisma.calibrationRecord.findMany({
            where,
            include: {
                device: {
                    include: {
                        location: true
                    }
                },
                hospital: true,
                technician: true,
            },
            orderBy: {
                scheduledDate: 'desc',
            },
        })

        return NextResponse.json(calibrations)
    } catch (error) {
        console.error('Error fetching calibration records:', error)
        return NextResponse.json(
            { error: 'Kalibrasyon kayıtları yüklenirken hata oluştu' },
            { status: 500 }
        )
    }
}

// POST /api/calibration - Yeni kalibrasyon kaydı oluştur
export async function POST(request: Request) {
    try {
        const body = await request.json()

        const calibration = await prisma.calibrationRecord.create({
            data: {
                deviceId: body.deviceId,
                hospitalId: body.hospitalId,
                status: body.status,
                scheduledDate: new Date(body.scheduledDate),
                completedDate: body.completedDate ? new Date(body.completedDate) : undefined,
                expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
                calibrationLab: body.calibrationLab,
                technicianId: body.technicianId,
                cost: body.cost ? parseFloat(body.cost) : undefined,
            },
            include: {
                device: {
                    include: {
                        location: true
                    }
                },
                hospital: true,
                technician: true,
            },
        })

        // Cihazın son kalibrasyon tarihini güncelle (completedDate varsa onu kullan)
        if (body.completedDate || body.expiryDate) {
            await prisma.device.update({
                where: { id: body.deviceId },
                data: {
                    lastCalibrationDate: body.completedDate ? new Date(body.completedDate) : undefined,
                    nextCalibrationDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
                },
            })
        }

        return NextResponse.json(calibration, { status: 201 })
    } catch (error) {
        console.error('Error creating calibration record:', error)
        return NextResponse.json(
            { error: 'Kalibrasyon kaydı oluşturulurken hata oluştu' },
            { status: 500 }
        )
    }
}

// DELETE /api/calibration - Toplu silme işlemi
export async function DELETE(request: Request) {
    try {
        const body = await request.json()
        const { ids } = body

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: 'Silinecek kayıtlar belirtilmedi' },
                { status: 400 }
            )
        }

        const result = await prisma.calibrationRecord.deleteMany({
            where: {
                id: {
                    in: ids
                }
            }
        })

        return NextResponse.json({
            message: `${result.count} kayıt başarıyla silindi`,
            count: result.count
        })
    } catch (error) {
        console.error('Error deleting calibration records:', error)
        return NextResponse.json(
            { error: 'Silme işlemi sırasında hata oluştu' },
            { status: 500 }
        )
    }
}
