import { NextResponse } from 'next/server'
import { restoreDatabaseFromJson } from '@/lib/database-utils'
import { requireSystemAdmin } from '@/lib/system-admin'

export async function POST(request: Request) {
    // Only system ADMIN can restore the system database
    const denied = await requireSystemAdmin('yedek geri yükleyebilir')
    if (denied) return denied

    try {
        const body = await request.json()
        const { data } = body

        if (!data) {
            return NextResponse.json(
                { error: 'Dosya verisi bulunamadı' },
                { status: 400 }
            )
        }

        // Decode base64 to string (JSON)
        const jsonString = Buffer.from(data, 'base64').toString('utf-8')

        // Use reviver to parse ISO dates automatically during parsing
        const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
        const jsonData = JSON.parse(jsonString, (key, value) => {
            if (typeof value === 'string' && dateRegex.test(value)) {
                return new Date(value);
            }
            return value;
        });

        await restoreDatabaseFromJson(jsonData)

        return NextResponse.json({
            success: true,
            message: 'Veritabanı başarıyla geri yüklendi'
        })
    } catch (error: any) {
        console.error('Error restoring database:', error)
        return NextResponse.json(
            { error: `Veritabanı geri yüklenirken hata oluştu: ${error.message || error}` },
            { status: 500 }
        )
    }
}


