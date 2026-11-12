import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

// GET - Excel olarak export
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const hospitalId = searchParams.get('hospitalId')

        const where: any = {}
        if (hospitalId) {
            where.hospitalId = hospitalId
        }

        const staff = await prisma.staff.findMany({
            where,
            include: {
                hospital: { select: { name: true } }
            },
            orderBy: { name: 'asc' }
        })

        // Excel için veri hazırla
        const data = staff.map(s => ({
            'Sicil No': s.registrationNumber,
            'TC Kimlik No': s.idNumber || '',
            'Ad Soyad': s.name,
            'Departman': s.department || '',
            'Unvan': s.title || '',
            'Telefon': s.phone || '',
            'E-posta': s.email || '',
            'Hastane': s.hospital?.name || '',
            'Aktif': s.isActive ? 'Evet' : 'Hayır'
        }))

        // Excel dosyası oluştur
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Personel')

        // Sütun genişlikleri
        ws['!cols'] = [
            { wch: 15 }, // Sicil No
            { wch: 15 }, // TC Kimlik
            { wch: 25 }, // Ad Soyad
            { wch: 20 }, // Departman
            { wch: 15 }, // Unvan
            { wch: 15 }, // Telefon
            { wch: 25 }, // E-posta
            { wch: 20 }, // Hastane
            { wch: 8 }   // Aktif
        ]

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="personel_listesi_${new Date().toISOString().split('T')[0]}.xlsx"`
            }
        })
    } catch (error) {
        console.error("Staff export error:", error)
        return NextResponse.json({ error: "Export başarısız" }, { status: 500 })
    }
}

// POST - Excel'den import
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const hospitalId = formData.get('hospitalId') as string

        if (!file) {
            return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 })
        }

        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        let imported = 0
        let skipped = 0
        const errors: string[] = []

        for (const row of jsonData as any[]) {
            const registrationNumber = row['Sicil No'] || row['sicil_no'] || row['SicilNo']
            const name = row['Ad Soyad'] || row['ad_soyad'] || row['AdSoyad'] || row['İsim']

            if (!registrationNumber || !name) {
                skipped++
                continue
            }

            try {
                // Mevcut kayıt kontrolü
                const existing = await prisma.staff.findUnique({
                    where: { registrationNumber: String(registrationNumber) }
                })

                if (existing) {
                    // Güncelle
                    await prisma.staff.update({
                        where: { id: existing.id },
                        data: {
                            idNumber: row['TC Kimlik No'] || row['tc_kimlik'] || existing.idNumber,
                            name: String(name),
                            department: row['Departman'] || row['departman'] || existing.department,
                            title: row['Unvan'] || row['unvan'] || existing.title,
                            phone: row['Telefon'] || row['telefon'] || existing.phone,
                            email: row['E-posta'] || row['email'] || existing.email,
                        }
                    })
                } else {
                    // Yeni ekle
                    await prisma.staff.create({
                        data: {
                            registrationNumber: String(registrationNumber),
                            idNumber: row['TC Kimlik No'] || row['tc_kimlik'] || null,
                            name: String(name),
                            department: row['Departman'] || row['departman'] || null,
                            title: row['Unvan'] || row['unvan'] || null,
                            phone: row['Telefon'] || row['telefon'] || null,
                            email: row['E-posta'] || row['email'] || null,
                            hospitalId: hospitalId || null
                        }
                    })
                }
                imported++
            } catch (err: any) {
                errors.push(`Satır ${imported + skipped + 1}: ${err.message}`)
                skipped++
            }
        }

        return NextResponse.json({
            success: true,
            imported,
            skipped,
            total: jsonData.length,
            errors: errors.slice(0, 5) // İlk 5 hata
        })
    } catch (error) {
        console.error("Staff import error:", error)
        return NextResponse.json({ error: "Import başarısız" }, { status: 500 })
    }
}
