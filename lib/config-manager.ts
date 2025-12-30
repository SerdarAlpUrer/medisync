/**
 * Configuration Manager
 * .env dosyasını okuma/yazma ve veritabanı bağlantı testi için yardımcı fonksiyonlar
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs'
import { join } from 'path'
import crypto from 'crypto'

// .env dosyasının yolu
const ENV_FILE_PATH = join(process.cwd(), '.env')
const ENV_BACKUP_PATH = join(process.cwd(), '.env.backup')

export interface EnvConfig {
    DATABASE_URL?: string
    NEXTAUTH_SECRET?: string
    NEXTAUTH_URL?: string
    UTS_API_URL?: string
    UTS_API_TOKEN?: string
    NODE_ENV?: string
    RATE_LIMIT_MAX_REQUESTS?: string
    RATE_LIMIT_WINDOW_MS?: string
    LOG_LEVEL?: string
}

export interface DatabaseConfig {
    host: string
    port: number
    database: string
    username: string
    password: string
}

/**
 * .env dosyasını oku ve parse et
 */
export function readEnvFile(): EnvConfig {
    if (!existsSync(ENV_FILE_PATH)) {
        return {}
    }

    try {
        const content = readFileSync(ENV_FILE_PATH, 'utf-8')
        const config: EnvConfig = {}

        content.split('\n').forEach(line => {
            // Boş satırları ve yorumları atla
            if (!line.trim() || line.trim().startsWith('#')) return

            const [key, ...valueParts] = line.split('=')
            if (key && valueParts.length > 0) {
                let value = valueParts.join('=').trim()
                // Tırnak işaretlerini kaldır
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1)
                }
                (config as any)[key.trim()] = value
            }
        })

        return config
    } catch (error) {
        console.error('Error reading .env file:', error)
        return {}
    }
}

/**
 * SQLite DATABASE_URL'i parse et (file:./path/to/db.db formatında)
 */
export function parseDatabaseUrl(url: string): DatabaseConfig | null {
    try {
        // SQLite: file:./path/to/database.db
        if (url.startsWith('file:')) {
            const dbPath = url.replace('file:', '')
            return {
                username: '',
                password: '',
                host: 'localhost',
                port: 0,
                database: dbPath
            }
        }
        return null
    } catch {
        return null
    }
}

/**
 * SQLite DATABASE_URL oluştur
 */
export function buildDatabaseUrl(config: DatabaseConfig): string {
    return `file:${config.database}`
}

/**
 * .env dosyasını güncelle
 */
export function writeEnvFile(config: EnvConfig): void {
    // Mevcut dosyayı yedekle
    if (existsSync(ENV_FILE_PATH)) {
        copyFileSync(ENV_FILE_PATH, ENV_BACKUP_PATH)
    }

    // Mevcut yapılandırmayı oku
    const existingConfig = readEnvFile()

    // Yeni değerlerle birleştir
    const mergedConfig = { ...existingConfig, ...config }

    // .env içeriğini oluştur
    const lines: string[] = [
        '# MediSync Environment Configuration',
        '# Bu dosya otomatik olarak oluşturulmuştur',
        '',
        '# Database',
        `DATABASE_URL="${mergedConfig.DATABASE_URL || ''}"`,
        '',
        '# NextAuth',
        `NEXTAUTH_SECRET="${mergedConfig.NEXTAUTH_SECRET || ''}"`,
        `NEXTAUTH_URL="${mergedConfig.NEXTAUTH_URL || 'http://localhost:3000'}"`,
        '',
        '# Application',
        `NODE_ENV="${mergedConfig.NODE_ENV || 'development'}"`,
        '',
        '# UTS API (Optional)',
        mergedConfig.UTS_API_URL ? `UTS_API_URL="${mergedConfig.UTS_API_URL}"` : '# UTS_API_URL=""',
        mergedConfig.UTS_API_TOKEN ? `UTS_API_TOKEN="${mergedConfig.UTS_API_TOKEN}"` : '# UTS_API_TOKEN=""',
        '',
        '# Rate Limiting',
        `RATE_LIMIT_MAX_REQUESTS="${mergedConfig.RATE_LIMIT_MAX_REQUESTS || '100'}"`,
        `RATE_LIMIT_WINDOW_MS="${mergedConfig.RATE_LIMIT_WINDOW_MS || '60000'}"`,
        '',
        '# Logging',
        `LOG_LEVEL="${mergedConfig.LOG_LEVEL || 'info'}"`,
        ''
    ]

    writeFileSync(ENV_FILE_PATH, lines.join('\n'), 'utf-8')
}

/**
 * Rastgele güvenlik anahtarı oluştur
 */
export function generateSecretKey(): string {
    return crypto.randomBytes(32).toString('hex')
}

/**
 * .env dosyasının var olup olmadığını kontrol et
 */
export function envFileExists(): boolean {
    return existsSync(ENV_FILE_PATH)
}

/**
 * Yapılandırmanın geçerli olup olmadığını kontrol et
 */
export function isConfigValid(config: EnvConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config.DATABASE_URL) {
        errors.push('DATABASE_URL gereklidir')
    } else if (!config.DATABASE_URL.startsWith('file:')) {
        errors.push('DATABASE_URL geçerli bir SQLite URL olmalıdır (file:./path/to/db.db)')
    }

    if (!config.NEXTAUTH_SECRET) {
        errors.push('NEXTAUTH_SECRET gereklidir')
    } else if (config.NEXTAUTH_SECRET.length < 32) {
        errors.push('NEXTAUTH_SECRET en az 32 karakter olmalıdır')
    }

    return {
        valid: errors.length === 0,
        errors
    }
}

/**
 * Hassas bilgileri maskele (API yanıtları için)
 */
export function maskSensitiveConfig(config: EnvConfig): EnvConfig {
    const masked = { ...config }

    // SQLite için DATABASE_URL maskeleme gerekmiyor (dosya yolu)
    // masked.DATABASE_URL aynı kalır

    if (masked.NEXTAUTH_SECRET) {
        masked.NEXTAUTH_SECRET = masked.NEXTAUTH_SECRET.substring(0, 8) + '****'
    }

    if (masked.UTS_API_TOKEN) {
        masked.UTS_API_TOKEN = '****'
    }

    return masked
}
