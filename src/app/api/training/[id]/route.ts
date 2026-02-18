import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/training/[id]
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

    const training = await prisma.trainingRecord.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, department: true }
        },
        deviceTrainings: {
          include: {
            device: {
              select: { id: true, name: true, tagNumber: true, brand: true, model: true }
            },
            deviceCategory: {
              select: { id: true, name: true, group: true }
            }
          }
        }
      }
    })

    if (!training) {
      return NextResponse.json({ error: 'Training not found' }, { status: 404 })
    }

    return NextResponse.json(training)
  } catch (error) {
    console.error('Error fetching training:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/training/[id]
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

    const {
      trainingType,
      title,
      description,
      trainingDate,
      duration,
      instructor,
      institution,
      content,
      contentFile,
      certificateNumber,
      certificateFile,
      expiryDate,
      status,
      score,
      notes,
      deviceIds,
      deviceCategoryIds
    } = body

    const updateData: any = {}
    if (trainingType) updateData.trainingType = trainingType
    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (trainingDate) updateData.trainingDate = new Date(trainingDate)
    if (duration) updateData.duration = duration
    if (instructor !== undefined) updateData.instructor = instructor
    if (institution !== undefined) updateData.institution = institution
    if (content !== undefined) updateData.content = content
    if (contentFile !== undefined) updateData.contentFile = contentFile
    if (certificateNumber !== undefined) updateData.certificateNumber = certificateNumber
    if (certificateFile !== undefined) updateData.certificateFile = certificateFile
    if (expiryDate) updateData.expiryDate = new Date(expiryDate)
    if (status) updateData.status = status
    if (score !== undefined) updateData.score = score
    if (notes !== undefined) updateData.notes = notes

    // Device trainings'i güncelle (basit yaklaşım: sil ve yeniden oluştur)
    if (deviceIds || deviceCategoryIds) {
      await prisma.deviceTraining.deleteMany({
        where: { trainingRecordId: id }
      })

      updateData.deviceTrainings = {
        create: [
          ...(deviceIds || []).map((deviceId: string) => ({
            deviceId,
            authorized: false
          })),
          ...(deviceCategoryIds || []).map((categoryId: string) => ({
            deviceCategoryId: categoryId,
            authorized: false
          }))
        ]
      }
    }

    const training = await prisma.trainingRecord.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        deviceTrainings: true
      }
    })

    return NextResponse.json(training)
  } catch (error) {
    console.error('Error updating training:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/training/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.trainingRecord.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Training deleted' })
  } catch (error) {
    console.error('Error deleting training:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
