import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { machineId } from 'node-machine-id'
import fs from 'fs'
import path from 'path'

// Master secret for activation signature
const LICENSE_SECRET = process.env.ACTIVATION_SECRET || "MEDISYNC_AUTH_MASTER_KEY_2026"
const ACTIVATION_BACKUP_PATH = path.join(process.cwd(), 'backups', 'activation.json')

export interface LicenseStatus {
    type: 'DEMO' | 'FULL' | 'EXPIRED'
    remainingHours: number
    remainingMinutes: number
    totalHours: number
    expiryDate: Date | null
    isActive: boolean
    licenseKey?: string
    deviceFingerprint: string
}

export class LicenseManager {
    /**
     * Cihazın benzersiz 8 karakterlik parmak izini döner (Donanım Kodu / HWID)
     */
    static async getDeviceFingerprint(): Promise<string> {
        try {
            const id = await machineId()
            return crypto.createHash('md5').update(id).digest('hex').substring(0, 8).toUpperCase()
        } catch (error) {
            console.error('Machine ID error:', error)
            return 'SYSTEM01'
        }
    }

    /**
     * Belirli bir makine kodu ve imzanın geçerli olup olmadığını doğrular
     */
    static verifyKey(key: string, currentHwid: string): boolean {
        try {
            if (!key) return false
            const cleanKey = key.trim().toUpperCase()

            // Bypass / Geliştirici anahtarı
            if (cleanKey === 'UNLIMITED-ACCESS-BYPASS') return true

            // Format: MEDISYNC-ACTIVE-<HWID>-<SIGNATURE>
            const parts = cleanKey.split('-')
            if (parts.length !== 4) return false
            if (parts[0] !== 'MEDISYNC' || parts[1] !== 'ACTIVE') return false

            const hwidInKey = parts[2]
            const signature = parts[3]

            if (hwidInKey !== 'ANY' && hwidInKey !== currentHwid) {
                return false
            }

            const payload = `MEDISYNC-ACTIVE-${hwidInKey}`
            const expectedSignature = crypto
                .createHmac('sha256', LICENSE_SECRET)
                .update(payload)
                .digest('hex')
                .substring(0, 8)
                .toUpperCase()

            return signature === expectedSignature
        } catch {
            return false
        }
    }

    /**
     * Sistem lisans ve onay durumunu kontrol eder
     */
    static async checkLicense(): Promise<LicenseStatus> {
        const deviceFingerprint = await this.getDeviceFingerprint()

        try {
            // 1. Önce veritabanındaki systemLicense kaydını kontrol et
            let license = await prisma.systemLicense.findUnique({
                where: { id: "license" }
            })

            // 2. Veritabanında yoksa veya anahtar boşsa, backups/activation.json dosyasından geri yükle
            if ((!license || !license.licenseKey) && fs.existsSync(ACTIVATION_BACKUP_PATH)) {
                try {
                    const raw = fs.readFileSync(ACTIVATION_BACKUP_PATH, 'utf-8')
                    const parsed = JSON.parse(raw)
                    if (parsed.licenseKey && this.verifyKey(parsed.licenseKey, deviceFingerprint)) {
                        license = await prisma.systemLicense.upsert({
                            where: { id: "license" },
                            update: {
                                isDemo: false,
                                isActive: true,
                                licenseKey: parsed.licenseKey,
                                hardwareId: deviceFingerprint
                            },
                            create: {
                                id: "license",
                                isDemo: false,
                                isActive: true,
                                licenseKey: parsed.licenseKey,
                                firstRunDate: new Date(),
                                hardwareId: deviceFingerprint
                            }
                        })
                    }
                } catch (backupReadErr) {
                    console.warn('Could not read activation backup:', backupReadErr)
                }
            }

            // 3. Lisans anahtarı geçerli mi?
            if (license && license.licenseKey) {
                const isValid = this.verifyKey(license.licenseKey, deviceFingerprint)
                if (isValid) {
                    return {
                        type: 'FULL',
                        remainingHours: 9999,
                        remainingMinutes: 0,
                        totalHours: 9999,
                        expiryDate: null,
                        isActive: true,
                        licenseKey: license.licenseKey,
                        deviceFingerprint
                    }
                }
            }
        } catch (dbErr) {
            console.error('License check database error:', dbErr)
        }

        // Lisans onaylanmamış
        return {
            type: 'EXPIRED',
            remainingHours: 0,
            remainingMinutes: 0,
            totalHours: 0,
            expiryDate: null,
            isActive: false,
            deviceFingerprint
        }
    }

    /**
     * Kullanıcıdan gelen aktivasyon anahtarını doğrular ve sisteme kaydeder
     */
    static async activateLicense(key: string): Promise<{ success: boolean; message: string }> {
        try {
            if (!key || typeof key !== 'string') {
                return { success: false, message: "Lütfen bir aktivasyon kodu girin." }
            }

            const cleanKey = key.trim().toUpperCase()
            const deviceFingerprint = await this.getDeviceFingerprint()

            const isValid = this.verifyKey(cleanKey, deviceFingerprint)
            if (!isValid) {
                return {
                    success: false,
                    message: `Aktivasyon kodu geçersiz veya bu makineye (${deviceFingerprint}) ait değil!`
                }
            }

            // Veritabanını güncelle
            await prisma.systemLicense.upsert({
                where: { id: "license" },
                update: {
                    isDemo: false,
                    isActive: true,
                    licenseKey: cleanKey,
                    hardwareId: deviceFingerprint,
                    expiryDate: null
                },
                create: {
                    id: "license",
                    isDemo: false,
                    isActive: true,
                    licenseKey: cleanKey,
                    hardwareId: deviceFingerprint,
                    firstRunDate: new Date(),
                    expiryDate: null
                }
            })

            // Dosyaya da yedekle
            try {
                const dir = path.dirname(ACTIVATION_BACKUP_PATH)
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
                fs.writeFileSync(ACTIVATION_BACKUP_PATH, JSON.stringify({
                    hardwareId: deviceFingerprint,
                    licenseKey: cleanKey,
                    activatedAt: new Date().toISOString()
                }, null, 2), 'utf-8')
            } catch (fileErr) {
                console.warn('Could not write activation backup file:', fileErr)
            }

            return { success: true, message: "MediSync başarıyla onaylandı ve aktive edildi! Hoş geldiniz." }
        } catch (error: any) {
            console.error("Lisans aktivasyon hatası:", error)
            return { success: false, message: "Aktivasyon sırasında bir hata oluştu: " + (error?.message || String(error)) }
        }
    }
}
