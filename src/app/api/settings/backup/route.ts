import { NextResponse } from 'next/server'
import { exportDatabaseToJson } from '@/lib/database-utils'
import { requireSystemAdmin } from '@/lib/system-admin'

export async function GET() {
    // Only system ADMIN can download full system backup
    const denied = await requireSystemAdmin('yedek indirebilir')
    if (denied) return denied

    try {
        const backupData = await exportDatabaseToJson()
        const jsonString = JSON.stringify(backupData, null, 2)

        return new NextResponse(jsonString, {
            headers: {
                'Content-Disposition': `attachment; filename="backup-${new Date().toISOString().split('T')[0]}.json"`,
                'Content-Type': 'application/json',
            },
        })
    } catch (error) {
        console.error('Backup error:', error)
        return NextResponse.json(
            { error: 'Yedekleme oluşturulurken hata oluştu' },
            { status: 500 }
        )
    }
}

export async function POST() {
    return GET()
}

