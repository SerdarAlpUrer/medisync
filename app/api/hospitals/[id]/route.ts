import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        console.log('Updating hospital:', id, body)
        const { name, code, address, phone, email } = body

        const hospital = await prisma.hospital.update({
            where: { id },
            data: {
                name,
                code,
                address,
                phone,
                email
            }
        })

        return NextResponse.json(hospital)
    } catch (error) {
        console.error('Error updating hospital:', error)
        return NextResponse.json(
            { error: 'Error updating hospital' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        
        // Check for related records first
        const hospital = await prisma.hospital.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        devices: true,
                        users: true,
                        maintenanceRecords: true,
                        calibrationRecords: true,
                        workOrders: true,
                        contracts: true
                    }
                }
            }
        })

        if (!hospital) {
            return NextResponse.json(
                { error: 'Şube bulunamadı' },
                { status: 404 }
            )
        }

        // Check if there are related records
        const { _count } = hospital
        if (_count.devices > 0 || _count.users > 0) {
            return NextResponse.json(
                { 
                    error: `Bu şube silinemez. Şubeye bağlı ${_count.devices} cihaz ve ${_count.users} kullanıcı bulunmaktadır. Önce bunları başka bir şubeye taşıyın veya silin.`
                },
                { status: 400 }
            )
        }

        // Delete related records first (those without cascade)
        await prisma.$transaction(async (tx) => {
            // Delete records that reference hospital
            await tx.maintenanceRecord.deleteMany({ where: { hospitalId: id } })
            await tx.calibrationRecord.deleteMany({ where: { hospitalId: id } })
            await tx.workOrder.deleteMany({ where: { hospitalId: id } })
            await tx.contract.deleteMany({ where: { hospitalId: id } })
            
            // Finally delete the hospital
            await tx.hospital.delete({ where: { id } })
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting hospital:', error)
        
        // Check for foreign key constraint error
        if (error.code === 'P2003' || error.message?.includes('foreign key constraint')) {
            return NextResponse.json(
                { error: 'Bu şube silinemez. Şubeye bağlı kayıtlar bulunmaktadır.' },
                { status: 400 }
            )
        }
        
        return NextResponse.json(
            { error: 'Şube silinirken bir hata oluştu' },
            { status: 500 }
        )
    }
}
