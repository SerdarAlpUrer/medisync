import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/decommissioning
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const hospitalId = searchParams.get('hospitalId')
    const deviceId = searchParams.get('deviceId')
    const status = searchParams.get('status')

    const where: any = {}
    if (hospitalId) where.hospitalId = hospitalId
    if (deviceId) where.deviceId = deviceId
    if (status) where.status = status

    const decommissionings = await prisma.deviceDecommissioning.findMany({
      where,
      include: {
        device: {
          select: { id: true, name: true, tagNumber: true, brand: true, model: true }
        },
        hospital: {
          select: { id: true, name: true, code: true }
        },
        requestedByUser: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { requestDate: 'desc' }
    })

    return NextResponse.json(decommissionings)
  } catch (error) {
    console.error('Error fetching decommissionings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/decommissioning
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      deviceId,
      hospitalId,
      requestedBy,
      reason,
      reasonDetails
    } = body

    if (!deviceId || !hospitalId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: deviceId, hospitalId, reason' },
        { status: 400 }
      )
    }

    // Decommission number oluştur
    const year = new Date().getFullYear()
    const count = await prisma.deviceDecommissioning.count({
      where: {
        decommissionNumber: {
          startsWith: `DEC-${year}-`
        }
      }
    })
    const decommissionNumber = `DEC-${year}-${String(count + 1).padStart(4, '0')}`

    const decommissioning = await prisma.deviceDecommissioning.create({
      data: {
        decommissionNumber,
        deviceId,
        hospitalId,
        requestedBy: requestedBy || session.user.id,
        reason,
        reasonDetails,
        status: 'REQUESTED',
        evaluationStatus: 'PENDING'
      },
      include: {
        device: true,
        hospital: true,
        requestedByUser: true
      }
    })

    return NextResponse.json(decommissioning, { status: 201 })
  } catch (error) {
    console.error('Error creating decommissioning:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
