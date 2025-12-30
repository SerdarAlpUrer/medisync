/**
 * API Route: /api/config/test-db
 * SQLite veritabanı bağlantısını test et
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { stat } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
    try {
        // SQLite veritabanı dosyasını kontrol et
        const dbPath = join(process.cwd(), 'prisma', 'dev.db')

        let dbSize = '0 Bytes'
        try {
            const stats = await stat(dbPath)
            dbSize = formatBytes(stats.size)
        } catch {
            // Dosya henüz oluşturulmamış olabilir
        }

        // Prisma ile basit bir sorgu çalıştır
        const result = await prisma.$queryRaw`SELECT sqlite_version() as version`
        const version = (result as any)[0]?.version || 'Unknown'

        return NextResponse.json({
            success: true,
            message: 'Bağlantı başarılı!',
            data: {
                version: version,
                databaseName: 'dev.db',
                currentUser: 'local',
                databaseSize: dbSize
            }
        })

    } catch (error: any) {
        console.error('Database connection test failed:', error)

        return NextResponse.json({
            success: false,
            error: error.message || 'Veritabanı bağlantısı başarısız',
            code: error.code
        }, { status: 400 })
    }
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
