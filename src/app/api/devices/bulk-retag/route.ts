import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cache, cacheKeys } from '@/lib/cache'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
        }

        // Fetch current format
        let settings = await prisma.appSettings.findUnique({
            where: { id: 'default' }
        })

        let format = (settings as any)?.deviceTagFormat || 'KUNYE-{YYYY}-{SEQ}'

        const now = new Date()
        const currentYear = now.getFullYear().toString()
        const currentShortYear = currentYear.substring(2)
        const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0')
        const currentDay = now.getDate().toString().padStart(2, '0')

        // Fetch all devices sorted by creation date or id
        const devices = await prisma.device.findMany({
            orderBy: { createdAt: 'asc' },
            include: { hospital: true }
        })

        if (devices.length === 0) {
            return NextResponse.json({ success: true, count: 0, message: 'Güncellenecek cihaz bulunamadı' })
        }

        let updatedCount = 0

        // Determine sequence padding
        let padLength = 4
        const customSeqMatch = format.match(/\{SEQ:(\d+)\}/i)
        let seqPlaceholder = '{SEQ}'
        if (customSeqMatch) {
            seqPlaceholder = customSeqMatch[0]
            padLength = parseInt(customSeqMatch[1], 10) || 4
        }

        for (let i = 0; i < devices.length; i++) {
            const dev = devices[i]
            let hospCode = 'HSP'
            if (dev.hospital) {
                if (dev.hospital.code) {
                    hospCode = dev.hospital.code.split('-')[0].toUpperCase()
                } else if (dev.hospital.name) {
                    hospCode = dev.hospital.name.substring(0, 4).toUpperCase()
                }
            }

            let prefix = format
                .replace(/\{YYYY\}/gi, currentYear)
                .replace(/\{YY\}/gi, currentShortYear)
                .replace(/\{MM\}/gi, currentMonth)
                .replace(/\{DD\}/gi, currentDay)
                .replace(/\{HOSP\}/gi, hospCode)
                .replace(/\{KURUM\}/gi, hospCode)
                .replace(/\{CODE\}/gi, hospCode)

            if (!prefix.includes(seqPlaceholder)) {
                prefix = `${prefix}-${seqPlaceholder}`
            }

            const seqStr = (i + 1).toString().padStart(padLength, '0')
            const newTag = prefix.replace(seqPlaceholder, seqStr)

            await prisma.device.update({
                where: { id: dev.id },
                data: { tagNumber: newTag }
            })
            updatedCount++
        }

        cache.delete(cacheKeys.devices('*'))
        cache.delete('dashboard:*')

        logger.info(`Bulk re-tagged ${updatedCount} devices to format: ${format}`)

        return NextResponse.json({
            success: true,
            count: updatedCount,
            format,
            message: `${updatedCount} adet cihazın künye numarası '${format}' formatına göre güncellendi.`
        })
    } catch (error) {
        logger.error('Bulk re-tag error', error as Error)
        return NextResponse.json({
            error: 'Toplu künye güncelleme hatası',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}
