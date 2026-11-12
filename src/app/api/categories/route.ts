import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/categories - Tüm kategorileri listele
export async function GET() {
    try {
        const categories = await prisma.deviceCategory.findMany({
            include: {
                _count: {
                    select: { devices: true }
                }
            },
            orderBy: {
                name: 'asc',
            },
        })

        return NextResponse.json(categories)
    } catch (error) {
        console.error('Error fetching categories:', error)
        return NextResponse.json(
            { error: 'Kategoriler yüklenirken hata oluştu' },
            { status: 500 }
        )
    }
}

// POST /api/categories - Yeni kategori ekle
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, code, group, description } = body

        if (!name || !name.trim()) {
            return NextResponse.json(
                { error: 'Kategori adı zorunludur' },
                { status: 400 }
            )
        }

        const cleanCode = code?.trim() || `CAT-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`

        const created = await prisma.deviceCategory.create({
            data: {
                name: name.trim(),
                code: cleanCode.toUpperCase(),
                group: group?.trim() || 'Genel',
                description: description?.trim() || null,
            }
        })

        return NextResponse.json(created, { status: 201 })
    } catch (error: any) {
        console.error('Error creating category:', error)
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Bu kategori kodu zaten kullanımda' },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Kategori oluşturulurken hata oluştu' },
            { status: 500 }
        )
    }
}

// PUT /api/categories - Kategori güncelle
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, name, group, description } = body

        if (!id || !name?.trim()) {
            return NextResponse.json(
                { error: 'Kategori ID ve adı zorunludur' },
                { status: 400 }
            )
        }

        const updated = await prisma.deviceCategory.update({
            where: { id },
            data: {
                name: name.trim(),
                group: group?.trim() || 'Genel',
                description: description?.trim() || null,
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Error updating category:', error)
        return NextResponse.json(
            { error: 'Kategori güncellenirken hata oluştu' },
            { status: 500 }
        )
    }
}

// DELETE /api/categories - Kategori sil
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID gerekli' }, { status: 400 })
        }

        const deviceCount = await prisma.device.count({
            where: { categoryId: id }
        })

        if (deviceCount > 0) {
            return NextResponse.json(
                { error: `Bu kategoriye bağlı ${deviceCount} adet cihaz bulunduğu için silinemez.` },
                { status: 400 }
            )
        }

        await prisma.deviceCategory.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting category:', error)
        return NextResponse.json(
            { error: 'Kategori silinirken hata oluştu' },
            { status: 500 }
        )
    }
}
