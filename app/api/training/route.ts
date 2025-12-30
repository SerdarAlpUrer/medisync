import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateUsageInstructions, generateSafetyWarnings } from '@/lib/instruction-generator'

// GET /api/training
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const deviceId = searchParams.get('deviceId')
    const deviceCategoryId = searchParams.get('deviceCategoryId')
    const status = searchParams.get('status')

    const where: any = {}
    if (userId) where.userId = userId
    if (status) where.status = status

    const trainings = await prisma.trainingRecord.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        deviceTrainings: {
          include: {
            device: deviceId ? {
              select: { id: true, name: true, tagNumber: true }
            } : false,
            deviceCategory: deviceCategoryId ? {
              select: { id: true, name: true, group: true }
            } : false
          }
        }
      },
      orderBy: { trainingDate: 'desc' }
    })

    // Filtreleme (frontend'de de yapılabilir ama backend'de daha verimli)
    let filtered = trainings
    if (deviceId) {
      filtered = filtered.filter(t =>
        t.deviceTrainings.some(dt => dt.deviceId === deviceId)
      )
    }
    if (deviceCategoryId) {
      filtered = filtered.filter(t =>
        t.deviceTrainings.some(dt => dt.deviceCategoryId === deviceCategoryId)
      )
    }

    return NextResponse.json(filtered)
  } catch (error) {
    console.error('Error fetching trainings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/training
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      userId,
      trainingType,
      title,
      description,
      trainingDate,
      duration,
      instructor,
      institution,
      content,
      deviceIds,
      deviceCategoryIds,
      passingScore
    } = body

    if (!userId || !trainingType || !title || !trainingDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Training number oluştur
    const year = new Date().getFullYear()
    const count = await prisma.trainingRecord.count({
      where: {
        trainingNumber: {
          startsWith: `TRN-${year}-`
        }
      }
    })
    const trainingNumber = `TRN-${year}-${String(count + 1).padStart(4, '0')}`

    // Training oluştur
    const training = await prisma.trainingRecord.create({
      data: {
        trainingNumber,
        userId,
        trainingType,
        title,
        description,
        trainingDate: new Date(trainingDate),
        duration: duration || 60,
        instructor,
        institution,
        content,
        passingScore: passingScore || 70,
        status: 'PLANNED',
        deviceTrainings: {
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
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        deviceTrainings: true
      }
    })

    return NextResponse.json(training, { status: 201 })
  } catch (error) {
    console.error('Error creating training:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
