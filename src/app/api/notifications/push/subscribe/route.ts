import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { endpoint, keys } = body

        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return NextResponse.json({ error: 'Geçersiz abonelik verisi' }, { status: 400 })
        }

        const sub = await prisma.pushSubscription.upsert({
            where: { endpoint },
            update: {
                userId: session.user.id,
                p256dh: keys.p256dh,
                auth: keys.auth,
            },
            create: {
                userId: session.user.id,
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth,
            },
        })

        return NextResponse.json({ success: true, subscription: sub })
    } catch (error) {
        console.error('Push subscribe error:', error)
        return NextResponse.json({ error: 'Abonelik kaydedilemedi' }, { status: 500 })
    }
}
