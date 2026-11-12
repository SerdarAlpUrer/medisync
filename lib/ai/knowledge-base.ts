/**
 * AI Knowledge Base for MediSync Chatbot
 * 
 * Contains FAQ entries and keyword matching for the AI assistant
 */

export interface KnowledgeEntry {
    id: string
    keywords: string[]
    question: string
    answer: string
    category: 'calibration' | 'maintenance' | 'general' | 'error' | 'procedure'
}

export const knowledgeBase: KnowledgeEntry[] = [
    // Calibration
    {
        id: 'cal-1',
        keywords: ['kalibrasyon', 'kalibre', 'nasıl', 'yapılır'],
        question: 'Kalibrasyon nasıl yapılır?',
        answer: 'Kalibrasyon için: 1) Dashboard > Kalibrasyon menüsüne gidin, 2) İlgili cihazı seçin, 3) "Yeni Kalibrasyon" butonuna tıklayın, 4) Kalibrasyon değerlerini girin ve kaydedin. Kalibrasyon sertifikası otomatik oluşturulur.',
        category: 'calibration'
    },
    {
        id: 'cal-2',
        keywords: ['kalibrasyon', 'süresi', 'periyot', 'ne zaman'],
        question: 'Kalibrasyon ne sıklıkla yapılmalı?',
        answer: 'Kalibrasyon periyodu cihaz türüne göre değişir: Defibrilatörler: 6 ay, Monitörler: 12 ay, Laboratuvar cihazları: 6-12 ay. Periyotları Ayarlar > Kalibrasyon Ayarları menüsünden özelleştirebilirsiniz.',
        category: 'calibration'
    },

    // Maintenance
    {
        id: 'maint-1',
        keywords: ['bakım', 'planlı', 'periyodik', 'nasıl'],
        question: 'Planlı bakım nasıl oluşturulur?',
        answer: 'Planlı bakım için: 1) Bakım Yönetimi menüsüne gidin, 2) "Yeni Bakım Planı" butonuna tıklayın, 3) Cihazı ve bakım tipini seçin, 4) Periyot ve başlangıç tarihini belirleyin. Sistem otomatik hatırlatma gönderecektir.',
        category: 'maintenance'
    },
    {
        id: 'maint-2',
        keywords: ['arıza', 'bildir', 'kayıt', 'nasıl'],
        question: 'Arıza bildirimi nasıl yapılır?',
        answer: 'Arıza bildirimi için: 1) İlgili cihazın detay sayfasına gidin, 2) "Arıza Bildir" butonuna tıklayın, 3) Arıza türünü ve açıklamasını girin. Alternatif olarak QR kodu tarayarak da hızlı bildirim yapabilirsiniz.',
        category: 'maintenance'
    },

    // Errors
    {
        id: 'err-1',
        keywords: ['hata', 'error', 'bağlantı', 'veritabanı'],
        question: 'Veritabanı bağlantı hatası alıyorum',
        answer: 'Veritabanı bağlantı hatası için: 1) PostgreSQL servisinin çalıştığından emin olun, 2) .env dosyasındaki DATABASE_URL değerini kontrol edin, 3) Firewall ayarlarını kontrol edin. Sorun devam ederse sistem yöneticinize başvurun.',
        category: 'error'
    },
    {
        id: 'err-2',
        keywords: ['hata', 'giriş', 'login', 'şifre'],
        question: 'Giriş yapamıyorum',
        answer: 'Giriş sorunu için: 1) E-posta adresinizi doğru yazdığınızdan emin olun, 2) Caps Lock kapalı mı kontrol edin, 3) "Şifremi Unuttum" ile şifrenizi sıfırlayın. Varsayılan giriş: admin@medisync.com / admin123',
        category: 'error'
    },

    // General
    {
        id: 'gen-1',
        keywords: ['qr', 'kod', 'tara', 'nasıl'],
        question: 'QR kod nasıl taranır?',
        answer: 'QR kod taramak için: 1) Dashboard\'da sağ üstteki QR ikona tıklayın veya Cihazlar > QR Tara seçeneğini kullanın, 2) Kameranıza izin verin, 3) Cihaz üzerindeki QR kodu kameraya gösterin. Cihaz bilgileri otomatik açılacaktır.',
        category: 'general'
    },
    {
        id: 'gen-2',
        keywords: ['rapor', 'oluştur', 'excel', 'pdf', 'dışa aktar'],
        question: 'Rapor nasıl oluşturulur?',
        answer: 'Rapor oluşturmak için: 1) Raporlar menüsüne gidin, 2) Rapor türünü seçin (Bakım, Kalibrasyon, Envanter vb.), 3) Tarih aralığı ve filtreleri belirleyin, 4) "Rapor Oluştur" butonuna tıklayın. PDF veya Excel formatında indirebilirsiniz.',
        category: 'general'
    },
    {
        id: 'gen-3',
        keywords: ['kullanıcı', 'ekle', 'yeni', 'personel'],
        question: 'Yeni kullanıcı nasıl eklenir?',
        answer: 'Yeni kullanıcı eklemek için: 1) Kullanıcılar menüsüne gidin (Admin yetkisi gerekli), 2) "Yeni Kullanıcı" butonuna tıklayın, 3) Ad, e-posta ve rol bilgilerini girin, 4) Kaydedin. Kullanıcıya otomatik şifre belirleme e-postası gönderilir.',
        category: 'general'
    },

    // Procedures
    {
        id: 'proc-1',
        keywords: ['defibrilatör', 'test', 'kontrol'],
        question: 'Defibrilatör günlük kontrol nasıl yapılır?',
        answer: 'Defibrilatör günlük kontrol: 1) Cihazı açın ve self-test yapmasını bekleyin, 2) Batarya seviyesini kontrol edin (%70 üstü olmalı), 3) Pedlerin son kullanma tarihini kontrol edin, 4) Aksesuarların tam olduğunu doğrulayın. Sonuçları sisteme kaydedin.',
        category: 'procedure'
    },
    {
        id: 'proc-2',
        keywords: ['monitör', 'hasta', 'başına', 'kurulum'],
        question: 'Hasta başı monitör kurulumu nasıl yapılır?',
        answer: 'Monitör kurulumu: 1) Cihazı güç kaynağına bağlayın, 2) Hasta bilgilerini girin, 3) İstenilen parametreleri (EKG, SpO2, NIBP vb.) aktif edin, 4) Alarm limitlerini hastaya göre ayarlayın, 5) Sensörleri hastaya takın ve sinyal kalitesini kontrol edin.',
        category: 'procedure'
    }
]

/**
 * Search knowledge base with keyword matching
 */
export function searchKnowledge(query: string): KnowledgeEntry[] {
    const normalizedQuery = query.toLowerCase().trim()
    const queryWords = normalizedQuery.split(/\s+/)

    // Score each entry based on keyword matches
    const scored = knowledgeBase.map(entry => {
        let score = 0

        for (const word of queryWords) {
            // Check keywords
            for (const keyword of entry.keywords) {
                if (keyword.includes(word) || word.includes(keyword)) {
                    score += 2
                }
            }

            // Check question text
            if (entry.question.toLowerCase().includes(word)) {
                score += 1
            }
        }

        return { entry, score }
    })

    // Return entries with score > 0, sorted by score
    return scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(s => s.entry)
}

/**
 * Get quick suggestions based on category
 */
export function getQuickSuggestions(): string[] {
    return [
        'Kalibrasyon nasıl yapılır?',
        'Arıza bildirimi nasıl yapılır?',
        'QR kod nasıl taranır?',
        'Rapor nasıl oluşturulur?'
    ]
}
