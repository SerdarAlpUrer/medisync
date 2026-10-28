import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateUsageInstructions, generateSafetyWarnings } from '@/lib/instruction-generator'
import { generateUsageInstructionPDF } from '@/lib/pdf-generator'

// POST /api/training/generate-instruction
// Cihaz için kullanım talimatı oluştur ve PDF olarak döndür
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { deviceId, deviceCategoryId } = body

    if (!deviceId && !deviceCategoryId) {
      return NextResponse.json(
        { error: 'deviceId or deviceCategoryId required' },
        { status: 400 }
      )
    }

    let device: any = null
    let category: any = null

    if (deviceId) {
      device = await prisma.device.findUnique({
        where: { id: deviceId },
        include: {
          category: true
        }
      })
      if (!device) {
        return NextResponse.json({ error: 'Device not found' }, { status: 404 })
      }
      category = device.category
    } else if (deviceCategoryId) {
      category = await prisma.deviceCategory.findUnique({
        where: { id: deviceCategoryId }
      })
      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }
    }

    const deviceName = device?.name || category?.name || 'Cihaz'
    const deviceBrand = device?.brand || ''
    const deviceModel = device?.model || ''
    const deviceCategory = category?.name || ''
    const deviceGroup = category?.group || ''

    // Talimat oluştur
    const instructions = generateUsageInstructions(deviceName, deviceCategory, deviceGroup)
    const safetyWarnings = generateSafetyWarnings(deviceCategory, deviceGroup)

    // Teknik özellikler (varsa)
    const technicalSpecs: Record<string, string> = {}
    if (device?.specifications) {
      try {
        const specs = JSON.parse(device.specifications)
        Object.assign(technicalSpecs, specs)
      } catch (e) {
        // JSON değilse string olarak kabul et
        technicalSpecs['Açıklama'] = device.specifications
      }
    }

    // PDF oluştur
    const pdf = generateUsageInstructionPDF(
      deviceName,
      deviceBrand,
      deviceModel,
      deviceCategory,
      instructions,
      safetyWarnings,
      technicalSpecs
    )

    // PDF'i base64 olarak döndür (frontend'de blob'a çevrilecek)
    const pdfBase64 = pdf.output('datauristring')

    return NextResponse.json({
      success: true,
      pdf: pdfBase64,
      instructions,
      safetyWarnings,
      deviceName,
      deviceBrand,
      deviceModel,
      deviceCategory
    })
  } catch (error) {
    console.error('Error generating instruction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/training/generate-instruction?deviceId=xxx veya ?deviceCategoryId=xxx
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')
    const deviceCategoryId = searchParams.get('deviceCategoryId')

    if (!deviceId && !deviceCategoryId) {
      return NextResponse.json(
        { error: 'deviceId or deviceCategoryId required' },
        { status: 400 }
      )
    }

    let device: any = null
    let category: any = null

    if (deviceId) {
      device = await prisma.device.findUnique({
        where: { id: deviceId },
        include: {
          category: true
        }
      })
      if (!device) {
        return NextResponse.json({ error: 'Device not found' }, { status: 404 })
      }
      category = device.category
    } else if (deviceCategoryId) {
      category = await prisma.deviceCategory.findUnique({
        where: { id: deviceCategoryId }
      })
      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }
    }

    const deviceName = device?.name || category?.name || 'Cihaz'
    const deviceBrand = device?.brand || ''
    const deviceModel = device?.model || ''
    const deviceCategory = category?.name || ''
    const deviceGroup = category?.group || ''

    // Talimat oluştur
    const instructions = generateUsageInstructions(deviceName, deviceCategory, deviceGroup)
    const safetyWarnings = generateSafetyWarnings(deviceCategory, deviceGroup)

    return NextResponse.json({
      success: true,
      instructions,
      safetyWarnings,
      deviceName,
      deviceBrand,
      deviceModel,
      deviceCategory,
      deviceGroup
    })
  } catch (error) {
    console.error('Error generating instruction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
