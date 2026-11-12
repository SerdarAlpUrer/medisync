import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

// GET /api/calibration - Tüm kalibrasyon kayıtlarını listele
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const deviceId = searchParams.get('deviceId')
        let hospitalId = searchParams.get('hospitalId')

        try {
            const user = await getAuthenticatedUser()
            const role = (user?.role || '').toUpperCase()
            const isTechnicalStaff = role === 'ADMIN' || role === 'ENGINEER' || role === 'TECHNICIAN' || role === 'SUPERVISOR'
            if (!isTechnicalStaff && user?.hospitalId) {
                hospitalId = user.hospitalId
            }
        } catch { }

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
                technician: { select: { id: true, name: true, email: true, role: true, department: true, phone: true } },
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

        let targetHospitalId = body.hospitalId
        if (!targetHospitalId && body.deviceId) {
            const dev = await prisma.device.findUnique({ where: { id: body.deviceId }, select: { hospitalId: true } })
            targetHospitalId = dev?.hospitalId
        }
        if (!targetHospitalId) {
            const defaultHosp = await prisma.hospital.findFirst({ select: { id: true } })
            targetHospitalId = defaultHosp?.id
        }

        const certNo = body.certificateNumber || `CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

        const calibration = await prisma.calibrationRecord.create({
            data: {
                deviceId: body.deviceId,
                hospitalId: targetHospitalId,
                status: body.status || 'SCHEDULED',
                scheduledDate: new Date(body.scheduledDate),
                completedDate: body.completedDate ? new Date(body.completedDate) : undefined,
                expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
                calibrationLab: body.calibrationLab || null,
                certificateNumber: certNo,
                certificateFile: body.certificateFile || `/api/certificates/${certNo}.pdf`,
                result: body.result || (body.status === 'COMPLETED' ? 'PASSED' : null),
                notes: body.notes || null,
                technicianId: body.technicianId || null,
                cost: body.cost !== undefined && body.cost !== '' && body.cost !== null ? parseFloat(body.cost) : undefined,
            },
            include: {
                device: {
                    include: {
                        location: true
                    }
                },
                hospital: true,
                technician: { select: { id: true, name: true, email: true, role: true, department: true, phone: true } },
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
