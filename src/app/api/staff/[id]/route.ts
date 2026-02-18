import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Tek personel detayı
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const staff = await prisma.staff.findUnique({
            where: { id },
            include: {
                hospital: { select: { id: true, name: true, code: true } },
                trainings: {
                    include: {
                        session: true
                    },
                    orderBy: { completedAt: 'desc' }
                }
            }
        })

        if (!staff) {
            return NextResponse.json({ error: "Personel bulunamadı" }, { status: 404 })
        }

        return NextResponse.json(staff)
    } catch (error) {
        console.error("Staff detail error:", error)
        return NextResponse.json({ error: "Personel bilgisi alınamadı" }, { status: 500 })
    }
}

// PUT - Personel güncelle
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const { registrationNumber, idNumber, name, department, title, phone, email, hospitalId, isActive } = body

        const staff = await prisma.staff.update({
            where: { id },
            data: {
                registrationNumber,
                idNumber: idNumber || null,
                name,
                department,
                title,
                phone,
                email,
                hospitalId: hospitalId || null,
                isActive: isActive ?? true
            },
            include: {
                hospital: { select: { id: true, name: true } }
            }
        })

        return NextResponse.json(staff)
    } catch (error: any) {
        console.error("Staff update error:", error)
        return NextResponse.json({
            error: "Personel güncellenemedi",
            details: error.message
        }, { status: 500 })
    }
}

// DELETE - Personel sil
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // First delete related training records
        await prisma.staffTraining.deleteMany({
            where: { staffId: id }
        })

        // Then delete the staff
        await prisma.staff.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Staff delete error:", error)
        return NextResponse.json({
            error: "Personel silinemedi",
            details: error.message
        }, { status: 500 })
    }
}

