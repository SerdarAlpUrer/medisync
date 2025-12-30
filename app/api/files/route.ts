import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const deviceId = searchParams.get('deviceId')
        const category = searchParams.get('category')

        // Check if Document model exists in schema
        // For now, return empty list - documents functionality requires separate setup
        try {
            // Try to use the Document model if it exists
            const documents = await (prisma as any).document?.findMany?.({
                where: {
                    ...(deviceId && { deviceId }),
                    ...(category && { category })
                },
                orderBy: { createdAt: 'desc' },
                take: 100
            })

            if (documents) {
                const files = documents.map((doc: any) => ({
                    id: doc.id,
                    fileName: doc.fileName || doc.name || 'Untitled',
                    fileType: doc.fileType || 'application/octet-stream',
                    filePath: doc.filePath || doc.url || '#',
                    fileSize: doc.fileSize || 0,
                    uploadedAt: doc.createdAt?.toISOString() || new Date().toISOString(),
                    uploadedBy: doc.uploadedBy || 'System',
                    deviceId: doc.deviceId,
                    deviceName: doc.device ? `${doc.device.name} - ${doc.device.brand}` : undefined,
                    category: doc.category || 'other'
                }))
                return NextResponse.json({ files })
            }
        } catch (modelError) {
            // Document model doesn't exist, continue with empty response
        }

        // Return empty files array - UI is ready for when Document model is added
        return NextResponse.json({
            files: [],
            message: 'Dosya yönetimi şu an aktif değil. Veritabanı şemasına Document modeli eklenmelidir.'
        })
    } catch (error) {
        logger.error('Error fetching files:', error as Error)
        return NextResponse.json({ error: 'Dosyalar yüklenemedi' }, { status: 500 })
    }
}
