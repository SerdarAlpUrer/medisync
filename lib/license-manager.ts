import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { machineId } from 'node-machine-id'

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
    deviceFingerprint?: string
}

export class LicenseManager {
    /**
     * Cihazın benzersiz 8 karakterlik parmak izini döner
     */
    static async getDeviceFingerprint(): Promise<string> {
        try {
            const id = await machineId()
            return crypto.createHash('md5').update(id).digest('hex').substring(0, 8).toUpperCase()
        } catch (error) {
            console.error('Machine ID error:', error)
            return 'UNKNOWN'
        }
    }

    /**
     * Sistem lisans durumunu kontrol eder
     * Eğer kayıt yoksa yeni bir demo kaydı oluşturur
     */
    static async checkLicense(): Promise<LicenseStatus> {
        // Geliştirme veya acil durum erişimi için lisans kontrolünü atla
        // İlerde tekrar lisans sormasını isterseniz bu değeri 'false' yapın.
        const BYPASS_LICENSE_CHECK = true;

        if (BYPASS_LICENSE_CHECK) {
            return {
                type: 'FULL',
                remainingHours: 9999,
                remainingMinutes: 0,
                totalHours: 9999,
                expiryDate: null,
                isActive: true,
                licenseKey: 'UNLIMITED-ACCESS-BYPASS',
                deviceFingerprint: await this.getDeviceFingerprint()
            }
        }

        // --- ORİJİNAL LİSANS KONTROL MANTIĞI ---
        let license = await prisma.systemLicense.findUnique({
            where: { id: "license" }
        })

        const deviceFingerprint = await this.getDeviceFingerprint()

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
            // 1. Donanım Kilidi Kontrolü
            const parts = license.licenseKey.split('-')
            // MEDISYNC-TYPE-DAYS-TIMESTAMP-HWID-SIGNATURE
            if (parts.length === 6) {
                const hwidInKey = parts[4]
                if (hwidInKey !== 'ANY' && hwidInKey !== deviceFingerprint) {
                    // Cihaz değişmiş!
                    return {
                        type: 'EXPIRED', // veya INVALID tipi eklenebilir ama EXPIRED iş görür
                        remainingHours: 0,
                        remainingMinutes: 0,
                        totalHours: 0,
                        expiryDate: license.expiryDate,
                        isActive: false,
                        licenseKey: license.licenseKey,
                        deviceFingerprint
                    }
                }
            }

            // 2. Lisans süresi dolmuş mu?
            if (license.expiryDate && now > license.expiryDate) {
                return {
                    type: 'EXPIRED',
                    remainingHours: 0,
                    remainingMinutes: 0,
                    totalHours: 0,
                    expiryDate: license.expiryDate,
                    isActive: false,
                    licenseKey: license.licenseKey,
                    deviceFingerprint
                }
            }

            return {
                type: 'FULL',
                remainingHours: -1, // Sınırsız
                remainingMinutes: -1,
                totalHours: -1,
                expiryDate: license.expiryDate,
                isActive: true,
                licenseKey: license.licenseKey,
                deviceFingerprint
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
                isActive: false,
                deviceFingerprint
            }
        }

        return {
            type: 'DEMO',
            remainingHours,
            remainingMinutes,
            totalHours: license.demoDurationHours,
            expiryDate: null,
            isActive: true,
            deviceFingerprint
        }
    }

    /**
     * Lisans anahtarı formatı değişti:
     * ESKİ: MEDISYNC-TYPE-DAYS-TIMESTAMP-SIGNATURE
     * YENİ: MEDISYNC-TYPE-DAYS-TIMESTAMP-HWID-SIGNATURE
     */
    static async activateLicense(key: string): Promise<{ success: boolean; message: string }> {
        try {
            // 0. Temizle ve Normalize et
            key = key.trim().toUpperCase()

            // 1. Format kontrolü
            if (!key || !key.includes('-')) {
                return { success: false, message: "Geçersiz lisans anahtarı formatı" }
            }

            // 2. Parçalara ayır
            const parts = key.split('-')

            // İmza doğrulama için payload ve signature ayır
            const payload = parts.slice(0, -1).join('-')
            const signature = parts[parts.length - 1]

            // İmzayı kontrol et
            const expectedSignature = crypto
                .createHmac('sha256', LICENSE_SECRET)
                .update(payload)
                .digest('hex')
                .substring(0, 8)
                .toUpperCase()

            if (signature !== expectedSignature) {
                return { success: false, message: "Geçersiz veya hatalı lisans anahtarı (İmza)" }
            }

            // 3. Payload çözümleme ve Donanım Kilidi
            if (parts.length === 6) {
                // YENİ FORMAT: Prefix-Type-Days-Time-HWID-Signature
                const [prefix, type, daysStr, timestamp, hwidInKey] = parts

                if (prefix !== 'MEDISYNC') return { success: false, message: "Geçersiz lisans" }

                const currentFingerprint = await this.getDeviceFingerprint()

                // Donanım KODU Eşleşmiyor ise
                if (hwidInKey !== 'ANY' && type !== 'RESET' && hwidInKey !== currentFingerprint) {
                    return {
                        success: false,
                        message: `Bu lisans başka bir cihaza kilitli! (Lisans Kodu: ${hwidInKey}, Sizin Kodunuz: ${currentFingerprint})`
                    }
                }

                // RESET İŞLEMİ
                if (type === 'RESET') {
                    await prisma.systemLicense.upsert({
                        where: { id: "license" },
                        update: {
                            isDemo: true,
                            isActive: true,
                            licenseKey: null,
                            firstRunDate: new Date(), // Sayacı sıfırla
                            demoDurationHours: 240, // 10 gün
                            expiryDate: null
                        },
                        create: {
                            id: "license",
                            isDemo: true,
                            isActive: true, // Resetlendiğinde aktif olsun
                            firstRunDate: new Date(),
                            demoDurationHours: 240
                        }
                    })
                    return { success: true, message: "Demo modu başarıyla sıfırlandı! İyi testler." }
                }

                // ... devam et
            } else if (parts.length === 5) {
                // ESKİ FORMAT (Geriye dönük uyumluluk)
            } else {
                return { success: false, message: "Bilinmeyen lisans formatı" }
            }

            const daysStr = parts.length === 6 ? parts[2] : parts[2] // Gün bilgisi
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
