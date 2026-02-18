import { NextResponse } from 'next/server'
import { getAuditLogs } from '@/lib/audit'

// GET /api/audit-logs - Audit logları getir
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)

        const entity = searchParams.get('entity') || undefined
        const action = searchParams.get('action') || undefined
        const userId = searchParams.get('userId') || undefined
        const startDate = searchParams.get('startDate')
            ? new Date(searchParams.get('startDate')!)
            : undefined
        const endDate = searchParams.get('endDate')
            ? new Date(searchParams.get('endDate')!)
            : undefined
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')

        const result = await getAuditLogs({
            entity,
            action,
            userId,
            startDate,
            endDate,
            page,
            limit
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error fetching audit logs:', error)
        return NextResponse.json(
            { error: 'Audit logları yüklenirken hata oluştu' },
            { status: 500 }
        )
    }
}
