/**
 * MediSync Activation Key Generator (Geliştirici Lisans / Onay Anahtarı Üretici)
 * Kullanım: node scripts/generate-key.js [MAKİNE_KODU] [KURUM_ADI]
 * Örnek: node scripts/generate-key.js BE7DF55A "Afyon Parkhayat"
 */

const crypto = require('crypto')
const readline = require('readline')

const LICENSE_SECRET = process.env.ACTIVATION_SECRET || "MEDISYNC_AUTH_MASTER_KEY_2026"

function generateKey(hwid, hospitalName = 'GENEL') {
    if (!hwid) {
        console.error('\n❌ HATA: Lütfen makine kodunu (HWID) girin.')
        return null
    }

    const cleanHwid = hwid.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    const payload = `MEDISYNC-ACTIVE-${cleanHwid}`

    const signature = crypto
        .createHmac('sha256', LICENSE_SECRET)
        .update(payload)
        .digest('hex')
        .substring(0, 8)
        .toUpperCase()

    const activationKey = `${payload}-${signature}`

    console.log('\n======================================================')
    console.log('🔑 MEDISYNC KURULUM ONAY & AKTİVASYON ANAHTARI')
    console.log('======================================================')
    console.log(`🖥️ Makine Kodu (HWID) : ${cleanHwid}`)
    if (hospitalName) {
        console.log(`🏥 Kurum / Müşteri    : ${hospitalName}`)
    }
    console.log(`⏱️ Üretim Tarihi       : ${new Date().toLocaleString('tr-TR')}`)
    console.log('------------------------------------------------------')
    console.log(`✅ AKTİVASYON KODU     : ${activationKey}`)
    console.log('------------------------------------------------------')
    console.log('💡 Bu kodu kullanıcıya Telegram üzerinden gönderebilirsiniz.')
    console.log('======================================================\n')

    return activationKey
}

const args = process.argv.slice(2)
const hwid = args[0]
const hospitalName = args.slice(1).join(' ')

if (hwid) {
    generateKey(hwid, hospitalName)
} else {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    console.log('\n======================================================')
    console.log('🔑 MEDISYNC AKTİVASYON ANAHTARI ÜRETİCİ (Serdar Alp Ürer)')
    console.log('======================================================')

    rl.question('🖥️  Müşterinin Donanım Kodunu (HWID) girin: ', (inputHwid) => {
        if (!inputHwid || !inputHwid.trim()) {
            console.log('❌ Kod girilmedi. İptal edildi.')
            rl.close()
            return
        }
        rl.question('🏥  Kurum / Hastane Adı (İsteğe bağlı): ', (inputHospital) => {
            generateKey(inputHwid, inputHospital || 'Genel Müşteri')
            rl.close()
        })
    })
}

module.exports = { generateKey, LICENSE_SECRET }
