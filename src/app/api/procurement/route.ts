import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/procurement
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    let hospitalId = searchParams.get('hospitalId')
    if (session.user.hospitalId) {
      hospitalId = session.user.hospitalId
    }
    const deviceId = searchParams.get('deviceId')
    const status = searchParams.get('status')

    const where: any = {}
    if (hospitalId) where.hospitalId = hospitalId
    if (deviceId) where.deviceId = deviceId
    if (status) where.deliveryStatus = status

    const procurements = await prisma.deviceProcurement.findMany({
      where,
      include: {
        device: {
          select: { id: true, name: true, tagNumber: true, brand: true, model: true }
        },
        hospital: {
          select: { id: true, name: true, code: true }
        },
        supplier: {
          select: { id: true, name: true, phone: true, email: true }
        },
        receivedByUser: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { orderDate: 'desc' }
    })

    return NextResponse.json(procurements)
  } catch (error) {
    console.error('Error fetching procurements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/procurement
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const targetHospitalId = session.user.hospitalId || body.hospitalId
    const {
      deviceId,
      supplierId,
      purchaseOrderNumber,
      orderDate,
      expectedDeliveryDate,
      actualDeliveryDate,
      deliveryChecklist,
      deliveryNotes
    } = body

    if (!targetHospitalId || !purchaseOrderNumber || !orderDate) {
      return NextResponse.json(
        { error: 'Missing required fields: hospitalId, purchaseOrderNumber, orderDate' },
        { status: 400 }
      )
    }

    const procurement = await prisma.deviceProcurement.create({
      data: {
        purchaseOrderNumber,
        deviceId: deviceId || null,
        hospitalId: targetHospitalId,
        supplierId: supplierId || null,
        orderDate: new Date(orderDate),
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
        actualDeliveryDate: actualDeliveryDate ? new Date(actualDeliveryDate) : null,
        deliveryStatus: 'PENDING',
        deliveryChecklist: deliveryChecklist ? JSON.stringify(deliveryChecklist) : null,
        deliveryNotes,
        commissioningStatus: 'PENDING'
      },
      include: {
        device: true,
        hospital: true,
        supplier: true
      }
    })

    return NextResponse.json(procurement, { status: 201 })
  } catch (error: any) {
    console.error('Error creating procurement:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Purchase order number already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
