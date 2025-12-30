import crypto from "crypto"

// license-manager.ts ile AYNI olmalı
const LICENSE_SECRET = "MEDISYNC_SECURE_V1_2025_KEY"

async function generateKey() {
    // Argümanları al
    // Örn: npx tsx scripts/keygen.ts --days=365

    const args = process.argv.slice(2)
    const daysArg = args.find(a => a.startsWith('--days='))?.split('=')[1] || "365"
    const typeArg = "FULL" // Şimdilik sadece FULL destekliyoruz

    const days = parseInt(daysArg)
    const timestamp = Math.floor(Date.now() / 1000)

    // Payload oluştur
    // Format: MEDISYNC-TYPE-DAYS-TIMESTAMP
    const payload = `MEDISYNC-${typeArg}-${days}-${timestamp}`

    // İmzala
    const signature = crypto
        .createHmac('sha256', LICENSE_SECRET)
        .update(payload)
        .digest('hex')
        .substring(0, 8)
        .toUpperCase()

    const fullKey = `${payload}-${signature}`

    console.log(`
=============================================
MEDISYNC KEY GENERATOR
=============================================
Type: ${typeArg}
Days: ${days}
Timestamp: ${timestamp}
---------------------------------------------
GENERATED KEY:
${fullKey}
=============================================
`)
}

generateKey()
