import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendTelegramBugAlert } from '@/lib/telegram'
import { sendBugReportEmail } from '@/lib/email'

/**
 * POST /api/bug-reports
 * Submit a software bug report or error
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()

    const {
      title,
      description,
      category = 'BUG',
      severity = 'MEDIUM',
      pageUrl,
      screenshotUrl,
      technicalDetails,
      userEmail,
      userName,
      hospitalName
    } = body

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Başlık ve açıklama alanları zorunludur' },
        { status: 400 }
      )
    }

    // Determine user & hospital metadata
    const finalUserEmail = session?.user?.email || userEmail || 'Bilinmiyor'
    const finalUserName = session?.user?.name || userName || 'İsimsiz Kullanıcı'
    const finalUserRole = (session?.user as any)?.role || 'USER'
    const finalHospitalId = session?.user?.hospitalId || null

    let finalHospitalName = hospitalName
    if (!finalHospitalName && finalHospitalId) {
      const hospital = await prisma.hospital.findUnique({
        where: { id: finalHospitalId },
        select: { name: true }
      })
      finalHospitalName = hospital?.name || 'PARKHAYAT Hastanesi'
    } else if (!finalHospitalName) {
      finalHospitalName = 'PARKHAYAT Afyonkarahisar Hastanesi'
    }

    // Save to Database
    const bugReport = await prisma.bugReport.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        pageUrl: pageUrl || null,
        screenshotUrl: screenshotUrl || null,
        technicalDetails: technicalDetails ? (typeof technicalDetails === 'string' ? technicalDetails : JSON.stringify(technicalDetails)) : null,
        userEmail: finalUserEmail,
        userName: finalUserName,
        userRole: finalUserRole,
        hospitalName: finalHospitalName,
        hospitalId: finalHospitalId,
        status: 'OPEN'
      }
    })

    // Trigger Notification Channels (Non-blocking async)
    const alertPayload = {
      reportId: bugReport.id,
      title: bugReport.title,
      description: bugReport.description,
      category: bugReport.category,
      severity: bugReport.severity,
      pageUrl: bugReport.pageUrl,
      userEmail: bugReport.userEmail,
      userName: bugReport.userName,
      hospitalName: bugReport.hospitalName,
      technicalDetails: bugReport.technicalDetails,
      screenshotUrl: bugReport.screenshotUrl
    }

    // 1. Telegram Alert
    sendTelegramBugAlert(alertPayload).catch((err) => {
      console.warn('Async Telegram alert error:', err)
    })

    // 2. Email Alert
    sendBugReportEmail(alertPayload).catch((err) => {
      console.warn('Async Email alert error:', err)
    })

    // 3. In-App Notification for Admins
    try {
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      })

      for (const admin of adminUsers) {
        await prisma.inAppNotification.create({
          data: {
            userId: admin.id,
            title: `Yazılım Hatası: ${bugReport.title}`,
            message: `${finalHospitalName} kurumundan ${finalUserName} yeni bir hata bildirdi.`,
            priority: bugReport.severity === 'CRITICAL' ? 'urgent' : 'high',
            category: 'bug_report',
            actionUrl: '/dashboard/bug-reports'
          }
        }).catch(() => {})
      }
    } catch (notifErr) {
      console.warn('In-app notification error:', notifErr)
    }

    return NextResponse.json({
      success: true,
      id: bugReport.id,
      message: 'Hata bildiriminiz kaydedildi ve yetkililere iletildi. Teşekkür ederiz.'
    })
  } catch (error: any) {
    console.error('Error creating bug report:', error)
    return NextResponse.json(
      { success: false, error: 'Hata bildirimi kaydedilemedi: ' + error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/bug-reports
 * List all bug reports (Supervisor / Admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Bu ekranı görüntüleme yetkiniz yok' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const severity = searchParams.get('severity')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}
    if (status && status !== 'ALL') {
      where.status = status
    }
    if (severity && severity !== 'ALL') {
      where.severity = severity
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { hospitalName: { contains: search, mode: 'insensitive' } },
        { userName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [reports, total, countOpen, countInProgress, countResolved] = await Promise.all([
      prisma.bugReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.bugReport.count({ where }),
      prisma.bugReport.count({ where: { status: 'OPEN' } }),
      prisma.bugReport.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.bugReport.count({ where: { status: 'RESOLVED' } }),
    ])

    return NextResponse.json({
      success: true,
      reports,
      total,
      page,
      limit,
      counts: {
        total: countOpen + countInProgress + countResolved,
        open: countOpen,
        inProgress: countInProgress,
        resolved: countResolved
      }
    })
  } catch (error: any) {
    console.error('Error fetching bug reports:', error)
    return NextResponse.json(
      { success: false, error: 'Hata listesi alınamadı: ' + error.message },
      { status: 500 }
    )
  }
}
