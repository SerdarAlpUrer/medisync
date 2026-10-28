import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/auth-middleware"

export const dynamic = 'force-dynamic'

// GET - Tüm personelleri listele
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        let hospitalId = searchParams.get('hospitalId')
        const search = searchParams.get('search')
        const department = searchParams.get('department')
        const isActive = searchParams.get('isActive')

        try {
            const user = await getAuthenticatedUser()
            if (user?.hospitalId) {
                hospitalId = user.hospitalId
            }
        } catch { }

        const where: any = {}

        if (hospitalId) {
            where.hospitalId = hospitalId
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { registrationNumber: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ]
        }

        if (department) {
            where.department = department
        }

        if (isActive !== null && isActive !== undefined) {
            where.isActive = isActive === 'true'
        }

        const staff = await prisma.staff.findMany({
            where,
            include: {
                hospital: { select: { id: true, name: true, code: true } },
                trainings: {
                    include: {
                        session: { select: { id: true, title: true, trainingDate: true } }
                    },
                    orderBy: { completedAt: 'desc' },
                    take: 5
                }
            },
            orderBy: { name: 'asc' }
        })

        // Departman listesi
        const departments = await prisma.staff.findMany({
            where: {
                department: { not: null },
                ...(hospitalId ? { hospitalId } : {})
            },
            select: { department: true },
            distinct: ['department']
        })

        return NextResponse.json({
            staff,
            departments: departments.map(d => d.department).filter(Boolean),
            total: staff.length
        })
    } catch (error) {
        console.error("Staff list error:", error)
        return NextResponse.json({ error: "Personel listesi alınamadı" }, { status: 500 })
    }
}

// POST - Yeni personel ekle
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { registrationNumber, idNumber, name, department, title, phone, email, hospitalId } = body

        if (!registrationNumber || !name) {
            return NextResponse.json(
                { error: "Sicil numarası ve ad zorunludur" },
                { status: 400 }
            )
        }

        // Sicil numarası kontrolü
        const existing = await prisma.staff.findUnique({
            where: { registrationNumber }
        })

        if (existing) {
            return NextResponse.json(
                { error: "Bu sicil numarası zaten kayıtlı" },
                { status: 400 }
            )
        }

        let targetHospitalId = hospitalId || null
        try {
            const user = await getAuthenticatedUser()
            if (user?.hospitalId) {
                targetHospitalId = user.hospitalId
            }
        } catch { }

        const staff = await prisma.staff.create({
            data: {
                registrationNumber,
                idNumber: idNumber || null,
                name,
                department,
                title,
                phone,
                email,
                hospitalId: targetHospitalId
            },
            include: {
                hospital: { select: { id: true, name: true } }
            }
        })

        return NextResponse.json(staff, { status: 201 })
    } catch (error) {
        console.error("Staff create error:", error)
        return NextResponse.json({ error: "Personel eklenemedi" }, { status: 500 })
    }
}
