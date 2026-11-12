/**
 * API Route: /api/config/test-db
 * PostgreSQL veritabanı bağlantısını test et
 */

import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'
import { buildDatabaseUrl, DatabaseConfig, envFileExists, isConfigValid, readEnvFile } from '@/lib/config-manager'
import { requireSystemAdmin } from '@/lib/system-admin'

export async function POST(request: NextRequest) {
    let client: Client | null = null

    // Kurulum modu dışında yalnızca sistem yöneticisi bağlantı testi yapabilir
    const setupMode = !envFileExists() || !isConfigValid(readEnvFile()).valid
    if (!setupMode) {
        const denied = await requireSystemAdmin('veritabanı bağlantı testi yapabilir')
        if (denied) return denied
    }

    try {
        const body = await request.json()
        const { host, port, database, username, password }: DatabaseConfig = body

        // Validasyon
        if (!host || !port || !database || !username) {
            return NextResponse.json({
                success: false,
                error: 'Host, port, veritabanı adı ve kullanıcı adı gereklidir'
            }, { status: 400 })
        }

        // Bağlantı URL'i oluştur
        const connectionUrl = password 
            ? buildDatabaseUrl({ host, port, database, username, password })
            : `postgresql://${username}@${host}:${port}/${database}`

        // PostgreSQL bağlantısını test et
        client = new Client({
            connectionString: connectionUrl,
            connectionTimeoutMillis: 10000, // 10 saniye timeout
        })

        await client.connect()

        // Basit bir sorgu çalıştır
        const result = await client.query('SELECT version()')
        const version = result.rows[0]?.version || 'Unknown'

        // Veritabanı bilgilerini al
        const dbInfo = await client.query(`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        pg_database_size(current_database()) as database_size
    `)

        const info = dbInfo.rows[0]

        await client.end()

        return NextResponse.json({
            success: true,
            message: 'Bağlantı başarılı!',
            data: {
                version: version.split(',')[0], // Sadece ana versiyon bilgisi
                databaseName: info.database_name,
                currentUser: info.current_user,
                databaseSize: formatBytes(parseInt(info.database_size))
            }
        })

    } catch (error: any) {
        console.error('Database connection test failed:', error)

        // Bağlantı hatası mesajlarını Türkçeleştir
        let errorMessage = 'Veritabanı bağlantısı başarısız'

        if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Bağlantı reddedildi. PostgreSQL sunucusunun çalıştığından emin olun.'
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = 'Sunucu bulunamadı. Host adresini kontrol edin.'
        } else if (error.code === '28P01' || error.code === '28000') {
            errorMessage = 'Kullanıcı adı veya şifre hatalı.'
        } else if (error.code === '3D000') {
            errorMessage = 'Belirtilen veritabanı bulunamadı.'
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Bağlantı zaman aşımına uğradı. Sunucu adresini ve port numarasını kontrol edin.'
        } else if (error.message) {
            errorMessage = error.message
        }

        return NextResponse.json({
            success: false,
            error: errorMessage,
            code: error.code
        }, { status: 400 })

    } finally {
        if (client) {
            try {
                await client.end()
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    }
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
