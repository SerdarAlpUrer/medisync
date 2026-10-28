import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/auth-middleware"

export const dynamic = 'force-dynamic'

// Eğitim oturumu numarası oluştur
async function generateSessionNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `TRN-${year}-`

    const lastSession = await prisma.trainingSession.findFirst({
        where: { sessionNumber: { startsWith: prefix } },
        orderBy: { sessionNumber: 'desc' }
    })

    let nextNum = 1
    if (lastSession) {
        const lastNum = parseInt(lastSession.sessionNumber.split('-').pop() || '0')
        nextNum = lastNum + 1
    }

    return `${prefix}${nextNum.toString().padStart(4, '0')}`
}

// GET - Eğitim oturumlarını listele
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        let hospitalId = searchParams.get('hospitalId')
        const search = searchParams.get('search')

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
                { title: { contains: search, mode: 'insensitive' } },
                { sessionNumber: { contains: search, mode: 'insensitive' } },
                { trainer: { contains: search, mode: 'insensitive' } }
            ]
        }

        const sessions = await prisma.trainingSession.findMany({
            where,
            include: {
                hospital: { select: { id: true, name: true } },
                attendees: {
                    include: {
                        staff: { select: { id: true, name: true, registrationNumber: true, department: true } }
                    }
                },
                documents: true
            },
            orderBy: { trainingDate: 'desc' }
        })

        return NextResponse.json(sessions)
    } catch (error) {
        console.error("Training sessions error:", error)
        return NextResponse.json({ error: "Eğitimler alınamadı" }, { status: 500 })
    }
}

// POST - Yeni eğitim oturumu oluştur (toplu katılımcı ile)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const {
            title,
            trainer,
            trainerOrg,
            durationMinutes,
            content,
            trainingDate,
            hospitalId,
            deviceCategoryId,
            validityMonths,
            staffIds, // Katılımcı personel ID'leri
            documents // Yüklenen dokümanlar [{ filename, filepath, filesize, mimetype }]
        } = body

        if (!title || !trainingDate) {
            return NextResponse.json(
                { error: "Eğitim konusu ve tarihi zorunludur" },
                { status: 400 }
            )
        }

        const sessionNumber = await generateSessionNumber()

        let targetHospitalId = hospitalId || null
        try {
            const user = await getAuthenticatedUser()
            if (user?.hospitalId) {
                targetHospitalId = user.hospitalId
            }
        } catch { }

        // Eğitim oturumu oluştur
        const session = await prisma.trainingSession.create({
            data: {
                sessionNumber,
                title,
                trainer,
                trainerOrg,
                durationMinutes: durationMinutes || 60,
                content,
                trainingDate: new Date(trainingDate),
                hospitalId: targetHospitalId,
                deviceCategoryId: deviceCategoryId || null,
                validityMonths: validityMonths || 12,
                documents: {
                    create: (documents || []).map((doc: any) => ({
                        filename: doc.originalName || doc.filename,
                        filepath: doc.path || doc.filename,
                        filesize: doc.filesize,
                        mimetype: doc.mimetype
                    }))
                }
            }
        })

        // Katılımcıları ekle
        if (staffIds && staffIds.length > 0) {
            const expiryDate = validityMonths
                ? new Date(new Date(trainingDate).setMonth(new Date(trainingDate).getMonth() + validityMonths))
                : null

            await prisma.staffTraining.createMany({
                data: staffIds.map((staffId: string) => ({
                    staffId,
                    sessionId: session.id,
                    status: 'COMPLETED',
                    completedAt: new Date(trainingDate),
                    expiryDate
                }))
            })
        }

        // Detaylı dön
        const result = await prisma.trainingSession.findUnique({
            where: { id: session.id },
            include: {
                attendees: {
                    include: {
                        staff: { select: { id: true, name: true, registrationNumber: true } }
                    }
                },
                documents: true
            }
        })

        return NextResponse.json(result, { status: 201 })
    } catch (error) {
        console.error("Training create error:", error)
        return NextResponse.json({ error: "Eğitim oluşturulamadı" }, { status: 500 })
    }
}
