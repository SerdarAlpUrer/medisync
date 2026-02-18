import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/procurement/[id]
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

    const procurement = await prisma.deviceProcurement.findUnique({
      where: { id },
      include: {
        device: true,
        hospital: true,
        supplier: true,
        receivedByUser: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!procurement) {
      return NextResponse.json({ error: 'Procurement not found' }, { status: 404 })
    }

    return NextResponse.json(procurement)
  } catch (error) {
    console.error('Error fetching procurement:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/procurement/[id]
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

    if (body.deliveryStatus) updateData.deliveryStatus = body.deliveryStatus
    if (body.deliveryChecklist) updateData.deliveryChecklist = JSON.stringify(body.deliveryChecklist)
    if (body.deliveryNotes !== undefined) updateData.deliveryNotes = body.deliveryNotes
    if (body.receivedBy) updateData.receivedBy = body.receivedBy
    if (body.receivedDate) updateData.receivedDate = new Date(body.receivedDate)
    if (body.actualDeliveryDate) updateData.actualDeliveryDate = new Date(body.actualDeliveryDate)

    if (body.installationStatus) updateData.installationStatus = body.installationStatus
    if (body.installationDate) updateData.installationDate = new Date(body.installationDate)
    if (body.installerName) updateData.installerName = body.installerName
    if (body.installationNotes) updateData.installationNotes = body.installationNotes
    if (body.testResults) updateData.testResults = JSON.stringify(body.testResults)

    if (body.acceptanceStatus) updateData.acceptanceStatus = body.acceptanceStatus
    if (body.acceptedBy) updateData.acceptedBy = body.acceptedBy
    if (body.acceptanceDate) updateData.acceptanceDate = new Date(body.acceptanceDate)
    if (body.rejectionReason) updateData.rejectionReason = body.rejectionReason

    if (body.commissioningStatus) updateData.commissioningStatus = body.commissioningStatus
    if (body.commissionedBy) updateData.commissionedBy = body.commissionedBy
    if (body.commissionedDate) updateData.commissionedDate = new Date(body.commissionedDate)
    if (body.firstUserTrainingDate) updateData.firstUserTrainingDate = new Date(body.firstUserTrainingDate)

    const procurement = await prisma.deviceProcurement.update({
      where: { id },
      data: updateData,
      include: {
        device: true,
        hospital: true,
        supplier: true,
        receivedByUser: true
      }
    })

    return NextResponse.json(procurement)
  } catch (error) {
    console.error('Error updating procurement:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
