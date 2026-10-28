import crypto from "crypto"

// license-manager.ts ile AYNI olmalı
const LICENSE_SECRET = "MEDISYNC_SECURE_V1_2025_KEY"

async function generateKey() {
    // Argümanları al
    // Örn: npx tsx scripts/keygen.ts --days=365 --machine-id=A1B2C3D4

    const args = process.argv.slice(2)
    const daysArg = args.find(a => a.startsWith('--days='))?.split('=')[1] || "365"
    let machineIdArg = args.find(a => a.startsWith('--machine-id='))?.split('=')[1] || "ANY"
    let typeArg = args.find(a => a.startsWith('--type='))?.split('=')[1] || "FULL" // FULL veya RESET

    // Normalize
    machineIdArg = machineIdArg.trim().toUpperCase()
    typeArg = typeArg.trim().toUpperCase()

    const days = parseInt(daysArg)
    const timestamp = Math.floor(Date.now() / 1000)

    // Payload oluştur
    // YENİ Format: MEDISYNC-TYPE-DAYS-TIMESTAMP-HWID
    const payload = `MEDISYNC-${typeArg}-${days}-${timestamp}-${machineIdArg}`

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
MEDISYNC KEY GENERATOR (SECURE)
=============================================
Type: ${typeArg}
Days: ${days}
Timestamp: ${timestamp}
Machine ID: ${machineIdArg}
---------------------------------------------
GENERATED KEY:
${fullKey}
=============================================
`)
}

generateKey()
