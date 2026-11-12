import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Bu işlem için yönetici yetkisi gereklidir' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { status, adminNotes } = body

    const updateData: any = {}
    if (status) {
      updateData.status = status
      if (status === 'RESOLVED' || status === 'CLOSED') {
        updateData.resolvedAt = new Date()
      }
    }
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes
    }

    const updated = await prisma.bugReport.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json({ success: true, report: updated })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Güncellenemedi: ' + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz işlem' },
        { status: 403 }
      )
    }

    await prisma.bugReport.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Silinemedi: ' + error.message },
      { status: 500 }
    )
  }
}
