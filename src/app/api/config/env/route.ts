/**
 * API Route: /api/config/env
 * .env dosyasını okuma ve güncelleme
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireSystemAdmin } from '@/lib/system-admin'
import {
    readEnvFile,
    writeEnvFile,
    maskSensitiveConfig,
    isConfigValid,
    envFileExists,
    EnvConfig
} from '@/lib/config-manager'

// GET: Mevcut yapılandırmayı oku
export async function GET(request: NextRequest) {
    try {
        // Kurulum modu: .env yoksa veya geçersizse herkes erişebilir
        const setupMode = !envFileExists() || !isConfigValid(readEnvFile()).valid

        if (!setupMode) {
            // Normal mod: sadece admin erişebilir
            const session = await getServerSession(authOptions)
            if (!session?.user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }

            // Admin kontrolü
            const userEmail = session.user.email
            if (userEmail !== 'admin@medisync.com' && (session.user as any).role !== 'ADMIN') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }

        const config = readEnvFile()
        const maskedConfig = maskSensitiveConfig(config)
        const validation = isConfigValid(config)

        return NextResponse.json({
            success: true,
            data: maskedConfig,
            isValid: validation.valid,
            errors: validation.errors,
            setupMode
        })
    } catch (error) {
        console.error('Error reading config:', error)
        return NextResponse.json({
            error: 'Yapılandırma okunamadı',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

// PUT: Yapılandırmayı güncelle
export async function PUT(request: NextRequest) {
    try {
        // Kurulum modu kontrolü
        const setupMode = !envFileExists() || !isConfigValid(readEnvFile()).valid

        if (!setupMode) {
            // Normal mod: yalnızca sistem yöneticisi .env dosyasını değiştirebilir
            const denied = await requireSystemAdmin('sunucu yapılandırmasını değiştirebilir')
            if (denied) return denied
        }

        const body = await request.json()
        const newConfig: EnvConfig = body

        // Validasyon
        const validation = isConfigValid(newConfig)
        if (!validation.valid) {
            return NextResponse.json({
                error: 'Geçersiz yapılandırma',
                errors: validation.errors
            }, { status: 400 })
        }

        // Dosyaya yaz
        writeEnvFile(newConfig)

        return NextResponse.json({
            success: true,
            message: 'Yapılandırma kaydedildi. Değişikliklerin etkili olması için uygulamayı yeniden başlatın.',
            requiresRestart: true
        })
    } catch (error) {
        console.error('Error writing config:', error)
        return NextResponse.json({
            error: 'Yapılandırma kaydedilemedi',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
