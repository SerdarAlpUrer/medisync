import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateUsageInstructions, generateSafetyWarnings } from '@/lib/instruction-generator'
import { generateUsageInstructionPDF } from '@/lib/pdf-generator'
import * as fs from 'fs'
import * as path from 'path'

function slugify(text: string): string {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\u00C0-\u017F-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

// GET /api/devices/[id]/usage-instruction
// QR kod sorgusu için kullanım talimatı döndür
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const device = await prisma.device.findUnique({
      where: { id },
      include: {
        category: true
      }
    })

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    let instructions = ''

    // Try to read from specific file first
    try {
      if (device.name) {
        const slug = slugify(device.name)
        const filePath = path.join(process.cwd(), 'public', 'docs', 'instructions', `${slug}.md`)
        if (fs.existsSync(filePath)) {
          instructions = fs.readFileSync(filePath, 'utf-8')
        }
      }
    } catch (e) {
      console.warn('Failed to read instruction file', e)
    }

    // Fallback to generator
    if (!instructions) {
      instructions = generateUsageInstructions(
        device.name,
        device.category.name,
        device.category.group || undefined
      )
    }

    const safetyWarnings = generateSafetyWarnings(
      device.category.name,
      device.category.group || undefined
    )

    // Teknik özellikler
    const technicalSpecs: Record<string, string> = {}
    if (device.specifications) {
      try {
        const specs = JSON.parse(device.specifications)
        Object.assign(technicalSpecs, specs)
      } catch (e) {
        technicalSpecs['Açıklama'] = device.specifications
      }
    }

    return NextResponse.json({
      success: true,
      device: {
        id: device.id,
        name: device.name,
        brand: device.brand,
        model: device.model,
        tagNumber: device.tagNumber,
        category: device.category.name,
        group: device.category.group
      },
      instructions,
      safetyWarnings,
      technicalSpecs
    })
  } catch (error) {
    console.error('Error fetching usage instruction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/devices/[id]/usage-instruction (PDF oluştur)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const device = await prisma.device.findUnique({
      where: { id },
      include: {
        category: true
      }
    })

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    let instructions = ''

    // Try to read from specific file first
    try {
      if (device.name) {
        const slug = slugify(device.name)
        const filePath = path.join(process.cwd(), 'public', 'docs', 'instructions', `${slug}.md`)
        if (fs.existsSync(filePath)) {
          instructions = fs.readFileSync(filePath, 'utf-8')
        }
      }
    } catch (e) {
      console.warn('Failed to read instruction file', e)
    }

    // Fallback to generator
    if (!instructions) {
      instructions = generateUsageInstructions(
        device.name,
        device.category.name,
        device.category.group || undefined
      )
    }

    const safetyWarnings = generateSafetyWarnings(
      device.category.name,
      device.category.group || undefined
    )

    // Teknik özellikler
    const technicalSpecs: Record<string, string> = {}
    if (device.specifications) {
      try {
        const specs = JSON.parse(device.specifications)
        Object.assign(technicalSpecs, specs)
      } catch (e) {
        technicalSpecs['Açıklama'] = device.specifications
      }
    }

    // PDF oluştur
    const pdf = generateUsageInstructionPDF(
      device.name,
      device.brand || '',
      device.model,
      device.category.name,
      instructions,
      safetyWarnings,
      technicalSpecs
    )

    // PDF'i base64 olarak döndür
    const pdfBase64 = pdf.output('datauristring')

    return NextResponse.json({
      success: true,
      pdf: pdfBase64,
      filename: `Kullanim_Talimati_${device.tagNumber || device.id}.pdf`
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
