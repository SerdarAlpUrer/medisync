import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Single training session
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await prisma.trainingSession.findUnique({
            where: { id },
            include: {
                hospital: { select: { id: true, name: true } },
                attendees: {
                    include: {
                        staff: true
                    }
                }
            }
        })

        if (!session) {
            return NextResponse.json({ error: "Eğitim bulunamadı" }, { status: 404 })
        }

        return NextResponse.json(session)
    } catch (error) {
        console.error("Training session detail error:", error)
        return NextResponse.json({ error: "Eğitim bilgisi alınamadı" }, { status: 500 })
    }
}

// PUT - Update training session
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const { title, trainer, trainerOrg, durationMinutes, content, trainingDate, validityMonths, staffIds } = body

        // Update session
        const session = await prisma.trainingSession.update({
            where: { id },
            data: {
                title,
                trainer,
                trainerOrg,
                durationMinutes: parseInt(durationMinutes) || 60,
                content,
                trainingDate: new Date(trainingDate),
                validityMonths: parseInt(validityMonths) || 12
            }
        })

        // Update attendees if staffIds provided
        if (staffIds && Array.isArray(staffIds)) {
            // Delete existing attendees
            await prisma.staffTraining.deleteMany({
                where: { sessionId: id }
            })

            // Add new attendees
            const expiryDate = new Date(trainingDate)
            expiryDate.setMonth(expiryDate.getMonth() + (parseInt(validityMonths) || 12))

            await prisma.staffTraining.createMany({
                data: staffIds.map((staffId: string) => ({
                    staffId,
                    sessionId: id,
                    completedAt: new Date(trainingDate),
                    expiryDate: expiryDate
                }))
            })
        }

        return NextResponse.json(session)
    } catch (error: any) {
        console.error("Training session update error:", error)
        return NextResponse.json({
            error: "Eğitim güncellenemedi",
            details: error.message
        }, { status: 500 })
    }
}

// DELETE - Delete training session
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Delete attendees first (cascade)
        await prisma.staffTraining.deleteMany({
            where: { sessionId: id }
        })

        // Delete session
        await prisma.trainingSession.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Training session delete error:", error)
        return NextResponse.json({
            error: "Eğitim silinemedi",
            details: error.message
        }, { status: 500 })
    }
}
