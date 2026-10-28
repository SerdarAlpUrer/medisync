import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/suppliers - Tüm tedarikçileri listele
export async function GET() {
    try {
        const suppliers = await prisma.supplier.findMany({
            include: {
                _count: {
                    select: { devices: true, contracts: true }
                }
            },
            orderBy: {
                name: 'asc',
            },
        })

        return NextResponse.json(suppliers)
    } catch (error) {
        console.error('Error fetching suppliers:', error)
        return NextResponse.json(
            { error: 'Tedarikçiler yüklenirken hata oluştu' },
            { status: 500 }
        )
    }
}

// POST /api/suppliers - Yeni tedarikçi / yetkili servis ekle
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, code, contact, phone, email, address, website } = body

        if (!name || !name.trim()) {
            return NextResponse.json(
                { error: 'Firma / Tedarikçi adı zorunludur' },
                { status: 400 }
            )
        }

        const cleanCode = code?.trim() || `SUP-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`

        const created = await prisma.supplier.create({
            data: {
                name: name.trim(),
                code: cleanCode.toUpperCase(),
                contact: contact?.trim() || null,
                phone: phone?.trim() || null,
                email: email?.trim() || null,
                address: address?.trim() || null,
                website: website?.trim() || null,
            }
        })

        return NextResponse.json(created, { status: 201 })
    } catch (error: any) {
        console.error('Error creating supplier:', error)
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Bu tedarikçi kodu zaten kullanımda' },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Tedarikçi oluşturulurken hata oluştu' },
            { status: 500 }
        )
    }
}

// PUT /api/suppliers - Tedarikçi güncelle
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, name, contact, phone, email, address, website } = body

        if (!id || !name?.trim()) {
            return NextResponse.json(
                { error: 'ID ve Firma adı zorunludur' },
                { status: 400 }
            )
        }

        const updated = await prisma.supplier.update({
            where: { id },
            data: {
                name: name.trim(),
                contact: contact?.trim() || null,
                phone: phone?.trim() || null,
                email: email?.trim() || null,
                address: address?.trim() || null,
                website: website?.trim() || null,
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Error updating supplier:', error)
        return NextResponse.json(
            { error: 'Tedarikçi güncellenirken hata oluştu' },
            { status: 500 }
        )
    }
}

// DELETE /api/suppliers - Tedarikçi sil
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID gerekli' }, { status: 400 })
        }

        const deviceCount = await prisma.device.count({
            where: { supplierId: id }
        })

        if (deviceCount > 0) {
            return NextResponse.json(
                { error: `Bu firmaya bağlı ${deviceCount} adet cihaz bulunduğu için silinemez.` },
                { status: 400 }
            )
        }

        await prisma.supplier.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting supplier:', error)
        return NextResponse.json(
            { error: 'Tedarikçi silinirken hata oluştu' },
            { status: 500 }
        )
    }
}
