import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateMaintenanceProcedure } from '@/lib/instruction-generator'
import { generateMaintenanceProcedurePDF } from '@/lib/pdf-generator'

// GET /api/maintenance/[id]/procedure
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

    const maintenance = await prisma.maintenanceRecord.findUnique({
      where: { id },
      include: {
        device: {
          include: {
            category: true
          }
        }
      }
    })

    if (!maintenance) {
      return NextResponse.json({ error: 'Maintenance record not found' }, { status: 404 })
    }

    const device = maintenance.device
    const procedure = generateMaintenanceProcedure(
      device.name,
      device.category.name,
      device.category.group || undefined
    )

    return NextResponse.json({
      success: true,
      procedure,
      device: {
        name: device.name,
        brand: device.brand,
        model: device.model,
        category: device.category.name,
        group: device.category.group
      }
    })
  } catch (error) {
    console.error('Error generating maintenance procedure:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/maintenance/[id]/procedure (PDF oluştur)
export async function POST(
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

    const maintenance = await prisma.maintenanceRecord.findUnique({
      where: { id },
      include: {
        device: {
          include: {
            category: true
          }
        }
      }
    })

    if (!maintenance) {
      return NextResponse.json({ error: 'Maintenance record not found' }, { status: 404 })
    }

    const device = maintenance.device
    const procedure = generateMaintenanceProcedure(
      device.name,
      device.category.name,
      device.category.group || undefined
    )

    // PDF oluştur
    const pdf = generateMaintenanceProcedurePDF(
      device.name,
      device.brand || '',
      device.model,
      device.category.name,
      procedure,
      body.frequency,
      body.requiredTools,
      body.safetyPrecautions
    )

    // PDF'i base64 olarak döndür
    const pdfBase64 = pdf.output('datauristring')

    // Bakım kaydına prosedürü kaydet
    await prisma.maintenanceRecord.update({
      where: { id },
      data: {
        procedure,
        procedureFile: `maintenance-procedure-${id}.pdf`
      }
    })

    return NextResponse.json({
      success: true,
      pdf: pdfBase64,
      filename: `Bakim_Proseduru_${device.tagNumber || device.id}_${id}.pdf`,
      procedure
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
