import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const STANDARD_DEPARTMENTS = [
    'Acil Servis',
    'Ameliyathane',
    'Anesteziyoloji ve Reanimasyon',
    'Beslenme ve Diyet',
    'Beyin ve Sinir Cerrahisi',
    'Biyokimya',
    'Çocuk Cerrahisi',
    'Çocuk Sağlığı ve Hastalıkları',
    'Dahiliye (İç Hastalıkları)',
    'Dermatoloji (Cildiye)',
    'Diş Polikliniği',
    'Eczane',
    'Endokrinoloji',
    'Enfeksiyon Hastalıkları',
    'Fizik Tedavi ve Rehabilitasyon',
    'Gastroenteroloji',
    'Genel Cerrahi',
    'Göğüs Cerrahisi',
    'Göğüs Hastalıkları',
    'Göz Hastalıkları',
    'Hematoloji',
    'Kadın Hastalıkları ve Doğum',
    'Kalp ve Damar Cerrahisi',
    'Kan Merkezi',
    'Kardiyoloji',
    'Kulak Burun Boğaz',
    'Laboratuvar',
    'Morg',
    'Nefroloji',
    'Nöroloji',
    'Nükleer Tıp',
    'Onkoloji',
    'Ortopedi ve Travmatoloji',
    'Patoloji',
    'Plastik, Rekonstrüktif ve Estetik Cerrahi',
    'Psikiyatri',
    'Radyoloji',
    'Romatoloji',
    'Sterilizasyon (MSÜ)',
    'Teknik Servis',
    'Üroloji',
    'Yemekhane',
    'Yoğun Bakım',
    'Çamaşırhane'
]

// GET /api/locations - Tüm lokasyonları listele
export async function GET() {
    try {
        let locations = await prisma.location.findMany({
            include: {
                _count: {
                    select: { devices: true }
                }
            },
            orderBy: {
                name: 'asc',
            },
        })

        // Sistemde hiç departman yoksa standart departmanları oluştur
        if (locations.length === 0) {
            console.log('Standart hastane departmanları senkronize ediliyor...')

            const locationsToCreate = STANDARD_DEPARTMENTS.map((deptName, idx) => ({
                name: deptName,
                code: `LOC-${(idx + 1).toString().padStart(3, '0')}`,
                description: deptName
            }))

            await prisma.location.createMany({
                data: locationsToCreate
            })

            locations = await prisma.location.findMany({
                include: {
                    _count: {
                        select: { devices: true }
                    }
                },
                orderBy: {
                    name: 'asc',
                },
            })
        }

        return NextResponse.json(locations)
    } catch (error) {
        console.error('Error fetching locations:', error)
        return NextResponse.json(
            { error: 'Lokasyonlar yüklenirken hata oluştu' },
            { status: 500 }
        )
    }
}

// POST /api/locations - Yeni bölüm/lokasyon ekle
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, code, building, floor, room, description } = body

        if (!name || !name.trim()) {
            return NextResponse.json(
                { error: 'Bölüm / Lokasyon adı zorunludur' },
                { status: 400 }
            )
        }

        const cleanCode = code?.trim() || `LOC-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`

        const created = await prisma.location.create({
            data: {
                name: name.trim(),
                code: cleanCode.toUpperCase(),
                building: building?.trim() || null,
                floor: floor?.trim() || null,
                room: room?.trim() || null,
                description: description?.trim() || null,
            }
        })

        return NextResponse.json(created, { status: 201 })
    } catch (error: any) {
        console.error('Error creating location:', error)
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Bu lokasyon kodu zaten kullanımda' },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Bölüm oluşturulurken hata oluştu' },
            { status: 500 }
        )
    }
}

// PUT /api/locations - Bölüm/lokasyon güncelle
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, name, building, floor, room, description } = body

        if (!id || !name?.trim()) {
            return NextResponse.json(
                { error: 'ID ve Bölüm adı zorunludur' },
                { status: 400 }
            )
        }

        const updated = await prisma.location.update({
            where: { id },
            data: {
                name: name.trim(),
                building: building?.trim() || null,
                floor: floor?.trim() || null,
                room: room?.trim() || null,
                description: description?.trim() || null,
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Error updating location:', error)
        return NextResponse.json(
            { error: 'Bölüm güncellenirken hata oluştu' },
            { status: 500 }
        )
    }
}

// DELETE /api/locations - Bölüm/lokasyon sil
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID gerekli' }, { status: 400 })
        }

        const deviceCount = await prisma.device.count({
            where: { locationId: id }
        })

        if (deviceCount > 0) {
            return NextResponse.json(
                { error: `Bu bölüme kayıtlı ${deviceCount} adet cihaz bulunduğu için silinemez.` },
                { status: 400 }
            )
        }

        await prisma.location.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting location:', error)
        return NextResponse.json(
            { error: 'Bölüm silinirken hata oluştu' },
            { status: 500 }
        )
    }
}
