import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { calculateDeviceUptime } from '@/lib/uptime-calculator'

// GET /api/devices/[id]/uptime
// Cihaz için uptime/downtime istatistiklerini döndür
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
    const { searchParams } = new URL(request.url)

    // Varsayılan olarak son 30 gün
    const days = parseInt(searchParams.get('days') || '30')
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const stats = await calculateDeviceUptime(id, startDate, endDate)

    return NextResponse.json({
      success: true,
      deviceId: id,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days
      },
      stats
    })
  } catch (error) {
    console.error('Error calculating uptime:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
