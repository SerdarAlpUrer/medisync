import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/decommissioning/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const decommissioning = await prisma.deviceDecommissioning.findUnique({
      where: { id },
      include: {
        device: true,
        hospital: true,
        requestedByUser: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!decommissioning) {
      return NextResponse.json({ error: 'Decommissioning not found' }, { status: 404 })
    }

    return NextResponse.json(decommissioning)
  } catch (error) {
    console.error('Error fetching decommissioning:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/decommissioning/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const updateData: any = {}

    // Değerlendirme
    if (body.evaluationStatus) updateData.evaluationStatus = body.evaluationStatus
    if (body.evaluatedBy) updateData.evaluatedBy = body.evaluatedBy
    if (body.evaluationDate) updateData.evaluationDate = new Date(body.evaluationDate)
    if (body.evaluationNotes) updateData.evaluationNotes = body.evaluationNotes
    if (body.technicalAssessment) updateData.technicalAssessment = JSON.stringify(body.technicalAssessment)

    // Onay
    if (body.approvalStatus) updateData.approvalStatus = body.approvalStatus
    if (body.approvedBy) updateData.approvedBy = body.approvedBy
    if (body.approvalDate) updateData.approvalDate = new Date(body.approvalDate)
    if (body.rejectionReason) updateData.rejectionReason = body.rejectionReason

    // Fiziksel İşlem
    if (body.disposalMethod) updateData.disposalMethod = body.disposalMethod
    if (body.disposalDate) updateData.disposalDate = new Date(body.disposalDate)
    if (body.disposalLocation) updateData.disposalLocation = body.disposalLocation
    if (body.disposalCertificate) updateData.disposalCertificate = body.disposalCertificate
    if (body.dataWiped !== undefined) updateData.dataWiped = body.dataWiped
    if (body.dataWipeDate) updateData.dataWipeDate = new Date(body.dataWipeDate)
    if (body.dataWipeMethod) updateData.dataWipeMethod = body.dataWipeMethod

    // Status
    if (body.status) updateData.status = body.status
    if (body.completedDate) updateData.completedDate = new Date(body.completedDate)

    const decommissioning = await prisma.deviceDecommissioning.update({
      where: { id },
      data: updateData,
      include: {
        device: true,
        hospital: true,
        requestedByUser: true
      }
    })

    // Eğer tamamlandıysa, cihazın durumunu güncelle
    if (body.status === 'COMPLETED' && decommissioning.deviceId) {
      await prisma.device.update({
        where: { id: decommissioning.deviceId },
        data: { status: 'DECOMMISSIONED' }
      })
    }

    return NextResponse.json(decommissioning)
  } catch (error) {
    console.error('Error updating decommissioning:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
