// Medical device types commonly found in hospitals
export const MEDICAL_DEVICE_TYPES = [
    // Görüntüleme Cihazları
    'MRI (Manyetik Rezonans)',
    'CT (Bilgisayarlı Tomografi)',
    'X-Ray (Röntgen)',
    'Ultrason',
    'Mamografi',
    'Anjiyografi',
    'Floroskopi',
    'C-Arm',

    // Laboratuvar Cihazları
    'Hematoloji Analiz Cihazı',
    'Biyokimya Analiz Cihazı',
    'Mikrobiyoloji Analiz Cihazı',
    'Koagülasyon Analiz Cihazı',
    'Mikrotom',
    'Santrifüj',
    'Inkübatör',
    'Otoklavsterilizatör',

    // Yaşam Destek Cihazları
    'Ventilatör (Solunum Cihazı)',
    'Anestezi Cihazı',
    'Hasta Monitörü',
    'Defibrilatör',
    'Oksijen Konsantratörü',
    'CPAP/BiPAP',
    'Infüzyon Pompası',
    'Şırınga Pompası',

    // Cerrahi Cihazlar
    'Elektrokoter',
    'Ameliyat Lambası',
    'Ameliyat Masası',
    'Endoskopi Sistemi',
    'Laparoskopi Sistemi',
    'Kriyoterapi Cihazı',
    'Argon Plazma Koagülasyon',

    // Kardiyovasküler
    'EKG (Elektrokardiyografi)',
    'Efor Testi Cihazı',
    'Holter Monitör',
    'Ekokardiyografi',

    // Fizik Tedavi ve Rehabilitasyon
    'Terapötik Ultrason',
    'TENS (Elektrik Stimülasyon)',
    'Traksiyon Cihazı',
    'Kısa Dalga Diyatermi',
    'Lazer Terapi Cihazı',

    // Diğer
    'Hasta Yatağı (Elektrikli)',
    'Aspiratör',
    'Nebülizatör',
    'Otakustik Emisyon Cihazı',
    'Fetal Monitör',
    'Diyaliz Makinesi',
    'Hiperbarik Oksijen Odası',
]

// Hospital departments/locations
export const HOSPITAL_DEPARTMENTS = [
    // Acil ve Yoğun Bakım
    'Acil Servis',
    'Yoğun Bakım Ünitesi',
    'Koroner Yoğun Bakım',
    'Neonatal Yoğun Bakım',
    'Yanık Ünitesi',

    // Ameliyat ve Müdahale
    'Ameliyathaneler',
    'Anjiyografi Laboratuvarı',
    'Endoskopi Ünitesi',

    // Görüntüleme
    'Radyoloji',
    'MR Ünitesi',
    'BT Ünitesi',
    'Ultrasonografi',
    'Nükleer Tıp',

    // Laboratuvar
    'Merkez Laboratuvar',
    'Mikrobiyoloji Laboratuvarı',
    'Patoloji Laboratuvarı',
    'Kan Bankası',

    // Klinikler
    'Dahiliye',
    'Genel Cerrahi',
    'Kadın Hastalıkları ve Doğum',
    'Çocuk Sağlığı ve Hastalıkları',
    'Kalp ve Damar Cerrahisi',
    'Ortopedi ve Travmatoloji',
    'Nöroloji',
    'Kardiyoloji',
    'Göğüs Hastalıkları',
    'Üroloji',

    // Destek Birimleri
    'Fizik Tedavi ve Rehabilitasyon',
    'Diyaliz Ünitesi',
    'Eczane',
    'Sterilizasyon Merkezi',
    'Tıbbi Atık Deposu',
]

// Custom entries storage keys
export const STORAGE_KEYS = {
    CUSTOM_DEVICE_TYPES: 'customDeviceTypes',
    CUSTOM_DEPARTMENTS: 'customDepartments',
}

// Load custom entries from localStorage
export function loadCustomDeviceTypes(): string[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_DEVICE_TYPES)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

export function loadCustomDepartments(): string[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_DEPARTMENTS)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

// Save custom entries to localStorage
export function saveCustomDeviceType(deviceType: string) {
    const existing = loadCustomDeviceTypes()
    if (!existing.includes(deviceType)) {
        const updated = [...existing, deviceType]
        localStorage.setItem(STORAGE_KEYS.CUSTOM_DEVICE_TYPES, JSON.stringify(updated))
    }
}

export function saveCustomDepartment(department: string) {
    const existing = loadCustomDepartments()
    if (!existing.includes(department)) {
        const updated = [...existing, department]
        localStorage.setItem(STORAGE_KEYS.CUSTOM_DEPARTMENTS, JSON.stringify(updated))
    }
}
