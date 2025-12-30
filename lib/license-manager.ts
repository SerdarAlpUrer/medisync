import { prisma } from "@/lib/prisma"
import crypto from "crypto"

// Gizli anahtar - Keygen ile aynı olmalı
const LICENSE_SECRET = "MEDISYNC_SECURE_V1_2025_KEY"

export interface LicenseStatus {
    type: 'DEMO' | 'FULL' | 'EXPIRED'
    remainingHours: number
    remainingMinutes: number
    totalHours: number
    expiryDate: Date | null
    isActive: boolean
    licenseKey?: string
}

export class LicenseManager {
    /**
     * Sistem lisans durumunu kontrol eder
     * Eğer kayıt yoksa yeni bir demo kaydı oluşturur
     */
    static async checkLicense(): Promise<LicenseStatus> {
        let license = await prisma.systemLicense.findUnique({
            where: { id: "license" }
        })

        // İlk çalıştırma - kayıt yoksa oluştur
        if (!license) {
            license = await prisma.systemLicense.create({
                data: {
                    id: "license",
                    isDemo: true,
                    isActive: true,
                    firstRunDate: new Date(),
                    demoDurationHours: 240 // 10 gün
                }
            })
        }

        const now = new Date()

        // Tam sürüm kontrolü
        if (!license.isDemo && license.licenseKey) {
            // Lisans süresi dolmuş mu?
            if (license.expiryDate && now > license.expiryDate) {
                return {
                    type: 'EXPIRED',
                    remainingHours: 0,
                    remainingMinutes: 0,
                    totalHours: 0,
                    expiryDate: license.expiryDate,
                    isActive: false,
                    licenseKey: license.licenseKey
                }
            }

            return {
                type: 'FULL',
                remainingHours: -1, // Sınırsız
                remainingMinutes: -1,
                totalHours: -1,
                expiryDate: license.expiryDate,
                isActive: true,
                licenseKey: license.licenseKey
            }
        }

        // Demo süresi hesaplama
        const elapsedMillis = now.getTime() - license.firstRunDate.getTime()
        const totalDemoMillis = license.demoDurationHours * 60 * 60 * 1000
        const remainingMillis = Math.max(0, totalDemoMillis - elapsedMillis)

        const remainingTotalMinutes = Math.floor(remainingMillis / (1000 * 60))
        const remainingHours = Math.floor(remainingTotalMinutes / 60)
        const remainingMinutes = remainingTotalMinutes % 60

        if (remainingMillis <= 0) {
            return {
                type: 'EXPIRED',
                remainingHours: 0,
                remainingMinutes: 0,
                totalHours: license.demoDurationHours,
                expiryDate: null,
                isActive: false
            }
        }

        return {
            type: 'DEMO',
            remainingHours,
            remainingMinutes,
            totalHours: license.demoDurationHours,
            expiryDate: null,
            isActive: true
        }
    }

    /**
     * Lisans anahtarını doğrular ve aktive eder
     */
    static async activateLicense(key: string): Promise<{ success: boolean; message: string }> {
        try {
            // 0. Temizle ve Normalize et
            key = key.trim().toUpperCase()

            // 1. Format kontrolü
            if (!key || !key.includes('-')) {
                return { success: false, message: "Geçersiz lisans anahtarı formatı" }
            }

            // 2. İmza doğrulama
            const parts = key.split('-')
            const payload = parts.slice(0, -1).join('-') // Son parça imza
            const signature = parts[parts.length - 1]

            const expectedSignature = crypto
                .createHmac('sha256', LICENSE_SECRET)
                .update(payload)
                .digest('hex')
                .substring(0, 8)
                .toUpperCase()

            if (signature !== expectedSignature) {
                return { success: false, message: "Geçersiz lisans anahtarı" }
            }

            // 3. Payload çözümleme
            // Format: MEDISYNC-TYPE-DAYS-TIMESTAMP-SIGNATURE
            // Örn: MEDISYNC-FULL-365-1735000000-A1B2C3D4
            const [prefix, type, daysStr] = parts

            if (prefix !== 'MEDISYNC') {
                return { success: false, message: "Bu anahtar bu yazılım için değil" }
            }

            const days = parseInt(daysStr)

            // 4. Veritabanını güncelle
            const expiryDate = new Date()
            expiryDate.setDate(expiryDate.getDate() + days)

            await prisma.systemLicense.upsert({
                where: { id: "license" },
                update: {
                    isDemo: false,
                    isActive: true,
                    licenseKey: key,
                    expiryDate: days === 9999 ? null : expiryDate // 9999 sınırsız demek olsun
                },
                create: {
                    id: "license",
                    isDemo: false,
                    isActive: true,
                    licenseKey: key,
                    firstRunDate: new Date(),
                    expiryDate: days === 9999 ? null : expiryDate
                }
            })

            return { success: true, message: "Lisans başarıyla etkinleştirildi" }

        } catch (error) {
            console.error("Lisans aktivasyon hatası:", error)
            return { success: false, message: "Aktivasyon sırasında bir hata oluştu" }
        }
    }
}
