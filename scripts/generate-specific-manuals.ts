
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Knowledge base for specific device types
const deviceKnowledgeBase: Record<string, any> = {
    // --- GÖRÜNTÜLEME (RADIOLOGY) ---
    'mri': {
        title: 'Manyetik Rezonans Görüntüleme (MRI) Sistemi',
        safety: [
            'DİKKAT: Yüksek Manyetik Alan! Metal eşyalarla (anahtar, telefon, kredi kartı, O2 tüpü) odaya girmek YASAKTIR.',
            'Kalp pili, koklear implant veya ferromanyetik implantı olan hastalar odaya alınmamalıdır.',
            'Helyum (Quench) seviyesi ve oksijen sensörü kontrolleri günlük yapılmalıdır.',
            'Acil durumda "Magnet Stop" butonunu sadece hayati risk varsa kullanın.'
        ],
        usage: [
            'Sistemi açın ve soğutma (helium) basınç değerlerini kontrol edin.',
            'Hasta kilosuna ve çekim bölgesine uygun koil (bobin) seçin.',
            'Hastaya acil durum butonunu verin ve iletişimi test edin.',
            'Lazer ile merkezleme (Isocenter) yapıp çekimi başlatın.',
            'SAR (Specific Absorption Rate) değerlerini monitorize edin.'
        ],
        maintenance: [
            'Günlük: Koil ve kablo bütünlüğü kontrolü.',
            'Günlük: Artefakt kontrolü için phantom çekimi.',
            'Aylık: Helyum kompresör ve chiller sistemi kontrolü.',
            'Yıllık: Homojenite ve SNR testleri.'
        ]
    },
    'tomografi': {
        title: 'Bilgisayarlı Tomografi (CT) Cihazı',
        safety: [
            'DİKKAT: İyonlaştırıcı Radyasyon. Kurşun önlük kullanın ve doz sınırlarına uyun.',
            'Hamilelik şüphesi olan hastalarda çekim yapmayınız.',
            'Otomatik enjektör kullanıyorsanız hava embolisine dikkat edin.',
            'Soğutma sistemi (Tüp Isısı) uyarılarını dikkate alın.'
        ],
        usage: [
            'Cihazı açın ve tüp ısınma (Warm-up) prosedürünü uygulayın.',
            'Hava kalibrasyonunu (Air Cal) gerçekleştirin.',
            'Hastayı Gantry içine doğru pozisyonlayın.',
            'Scout (Kılavuz) görüntü üzerinden tarama alanını belirleyin.',
            'Çekim bitince hastayı çıkarın ve görüntüleri PACS\'e gönderin.'
        ],
        maintenance: [
            'Günlük: Warm-up ve hava kalibrasyonu.',
            'Haftalık: Fantom ile HU (Hounsfield Unit) doğrulama.',
            'Yıllık: Tüp performansı ve doz ölçümleri.'
        ]
    },
    'röntgen': {
        title: 'Dijital Röntgen (X-Ray) Cihazı',
        safety: [
            'Radyasyon alanı dışında durun ve koruyucu paravan arkasından çekim yapın.',
            'Kolimatör ayarını sadece çekilecek bölgeye odaklayın (Gereksiz maruziyeti önleyin).',
            'Dedektör paneline darbe gelmemesine dikkat edin (Çok hassas ve pahalıdır).'
        ],
        usage: [
            'Jeneratörü açın ve dedektör bağlantısını kontrol edin.',
            'Hastaya uygun pozisyonu verin (Ayakta veya Masada).',
            'kV ve mAs değerlerini hasta boyutuna göre seçin.',
            '"X-Ray" butonuna sesli sinyal bitene kadar basılı tutun.',
            'Görüntü önizlemesini (Preview) kontrol edin.'
        ],
        maintenance: [
            'Günlük: Dedektör temizliği ve şarj durumu kontrolü.',
            'Haftalık: Mekanik hareketlerin (Tüp standı) kontrolü.',
            'Yıllık: Doz kalibrasyonu ve kolimasyon testi.'
        ]
    },
    'mammografi': {
        title: 'Dijital Mamografi Cihazı',
        safety: [
            'Kompresyon kuvvetini hastanın toleransına göre ayarlayın, aşırı baskıdan kaçının.',
            'Radyasyon koruma prensiplerine tam uyum sağlayın.',
            'Paddle (sıkıştırma plakası) çatlaklarına dikkat edin.'
        ],
        usage: [
            'Cihazı açın ve dedektör kalibrasyonunu yapın.',
            'Hastayı uygun pozisyona (CC veya MLO) getirin.',
            'Yavaşça kompresyon uygulayın.',
            'Çekimi yapın ve kompresyonu derhal serbest bırakın.'
        ],
        maintenance: [
            'Günlük: Sıkıştırma pedallarının temizliği.',
            'Haftalık: ACR fantom çekimi.',
            'Yıllık: Mekanik güvenlik ve doz testleri.'
        ]
    },
    'ultrason': {
        title: 'Ultrasonografi / Doppler Cihazı',
        safety: [
            'Probları (Transducer) düşürmeyin, kristaller kırılabilir.',
            'Prob temizliğinde alkol bazlı kimyasalları lense temas ettirmeyin.',
            'Elektrik kablolarının tekerlekler altında ezilmesini önleyin.'
        ],
        usage: [
            'Hastanın kimlik bilgilerini girin.',
            'İncelenecek bölgeye uygun probu seçin (Lineer, Konveks, Kardiyak).',
            'Jel uygulayın ve görüntülemeye başlayın.',
            'Gain, Depth ve Focus ayarlarını optimize edin.',
            'İşlem sonrası prob üzerindeki jeli yumuşak doku ile temizleyin.'
        ],
        maintenance: [
            'Her Hasta Sonrası: Prob temizliği.',
            'Aylık: Filtrelerin temizliği (Hava sirkülasyonu için).',
            'Yıllık: Elektriksel güvenlik ve prob kristal testi.'
        ]
    },

    // --- AMELİYATHANE & ANESTEZİ ---
    'anestezi': {
        title: 'Anestezi İş İstasyonu',
        safety: [
            'Kaçak testini (Leak Test) her sabah mutlaka yapın.',
            'Soda lime (Karbondioksit tutucu) renk değişimini kontrol edin, gerekirse değiştirin.',
            'Vaporizatörlerin doluluk oranını ve kilitlerini kontrol edin.',
            'Yedek oksijen tüpünün dolu olduğunu doğrulayın.'
        ],
        usage: [
            'Cihazı açın ve otomatik  testlerin tamamlanmasını bekleyin.',
            'Hasta devresini takın ve kaçak testini yapın.',
            'Ventilasyon parametrelerini (TV, Rate, PEEP) ayarlayın.',
            'Akışmetreden taze gaz akışını (O2/Air/N2O) ayarlayın.',
            'Operasyon bitiminde cihazı "Standby" moduna alın.'
        ],
        maintenance: [
            'Günlük: O2 sensör kalibrasyonu ve flow sensör temizliği.',
            'Haftalık: Körük ve valf temizliği.',
            'Yıllık: Vaporizatör kalibrasyonu ve tam bakım.'
        ]
    },
    'koter': {
        title: 'Elektrokoter (Elektrocerrahi) Cihazı',
        safety: [
            'Hasta plağının (Nötr elektrot) tam temas ettiğinden emin olun (Yanık riski).',
            'Alkol bazlı dezenfektanlar kurumadan koter kullanmayın.',
            'Kalp pili olan hastalarda Bipolar mod tercih edin.'
        ],
        usage: [
            'Plağı hastanın kaslı bir bölgesine yapıştırın.',
            'Cihazı açın ve "REM" (Plak hatası) alarmı vermediğini görün.',
            'Kesme (Cut) ve Koagülasyon (Coag) güçlerini ayarlayın.',
            'Cerrahın komutuyla pedala basarak enerjiyi verin.',
            'Kalem ucundaki karbon birikimini düzenli temizleyin.'
        ],
        maintenance: [
            'Her Vaka Sonrası: Kalem ve plak değişimi (Tek kullanımlıksa).',
            'Aylık: Güç çıkış testleri.',
            'Yıllık: Elektriksel güvenlik testi.'
        ]
    },
    'ameliyat masası': {
        title: 'Ameliyat Masası',
        safety: [
            'Hastanın düşmemesi için emniyet kemerlerini takın.',
            'Masa frenlerinin kilitli olduğundan emin olun.',
            'Hareket verirken kabloların sıkışmamasına dikkat edin.',
            'Maksimum yük kapasitesini aşmayın.'
        ],
        usage: [
            'Masayı frenleyin.',
            'Kumandadan hastaya uygun pozisyonu (Tilt, Trendelenburg) verin.',
            'Aksesuarları (Kolçak, bacaklık) güvenli şekilde sabitleyin.',
            'Şarjı azaldıysa fişe takın.'
        ],
        maintenance: [
            'Günlük: Minder temizliği (Kan ve sıvıdan arındırma).',
            'Haftalık: Hidrolik yağ kaçağı kontrolü.',
            'Yıllık: Hareketli aksamların yağlanması.'
        ]
    },
    'ameliyat lambası': {
        title: 'Ameliyat/Cerrahi Lamba',
        safety: [
            'Lamba başlığını hastanın üzerine düşürmemek için bağlantıların sıkılığını kontrol edin.',
            'Ampul patlaması riskine karşı ön camın sağlamlığını kontrol edin.',
            'Işık şiddetini göze zarar vermeyecek şekilde ayarlayın.'
        ],
        usage: [
            'Lambayı steril kulp kullanarak cerrahi alana odaklayın.',
            'Işık şiddetini ve odak çapını panelden ayarlayın.',
            'Kamera varsa (Endovizyon) odak ayarını yapın.'
        ],
        maintenance: [
            'Günlük: Steril kulpların sterilizasyonu.',
            'Haftalık: Kol mekanizmasının (Amortisör) dengesi.',
            'Yıllık: Işık şiddeti (Lux) ölçümü.'
        ]
    },
    'mikroskop': {
        title: 'Cerrahi Mikroskop',
        safety: [
            'Denge kollarının ayarlarını kontrol edin, başlık aniden düşmemelidir.',
            'Işık kaynağının (Xenon/LED) soğutma fanlarının çalıştığından emin olun.',
            'Göz merceklerini (Okler) çizilmelere karşı koruyun.'
        ],
        usage: [
            'Cihazı cerrahi alana yaklaştırın ve denge (Balance) ayarını yapın.',
            'Işık kaynağını açın.',
            'Okülerlerden bakarak diyoptri ve pupila mesafesini ayarlayın.',
            'Ayak pedalı ile zoom ve focus yapın.'
        ],
        maintenance: [
            'Her Vaka Sonrası: Lenslerin özel solüsyonla temizliği.',
            'Aylık: Fiber optik kablo ışık geçirgenliği kontrolü.',
            'Yıllık: Optik eksen ayarı.'
        ]
    },

    // --- YOĞUN BAKIM & ACİL ---
    'ventilatör': {
        title: 'Mekanik Ventilatör',
        safety: [
            'Hasta devresi (hortum) bağlantılarının sıkı olduğunu kontrol edin.',
            'Alarm seslerini asla tamamen kapatmayın.',
            'Filtrelerin tıkalı olmadığından emin olun.',
            'Yedek ambu ve oksijen kaynağını hazır bulundurun.'
        ],
        usage: [
            'Cihazı O2 ve Hava prizlerine bağlayın.',
            'Açılış testlerini (SST/EST) tamamlayın.',
            'Devreyi hastaya bağlamadan önce test balonunda deneyin.',
            'Mod (CPAP, SIMV) ve parametreleri ayarlayın.',
            'Hastayı bağlayın ve ekspirasyon valfinin çalıştığını gözlemleyin.'
        ],
        maintenance: [
            'Her Hasta Değişiminde: Devre ve valf değişimi/sterilizasyonu.',
            'Günlük: O2 Kalibrasyonu.',
            '3 Ayda Bir: Bakteri filtresi ve fan filtresi değişimi.'
        ]
    },
    'defibrilatör': {
        title: 'Defibrilatör (Elektroşok) Cihazı',
        safety: [
            'Şok verirken hastaya ve yatağa temas etmeyin.',
            'Yüksek oksijen ortamında şok vermeyin (Yangın riski).',
            'Pedleri kalp pili üzerine yapıştırmayın.'
        ],
        usage: [
            'Monitörizasyon için kaşıkları veya EKG kablolarını bağlayın.',
            'Enerji (Joule) seçimi yapın.',
            '"Charge" (Şarj) butonuna basın.',
            '"Herkes açılsın!" uyarısını yapın.',
            '"Shock" butonuna basarak enerjiyi boşaltın.'
        ],
        maintenance: [
            'Her Vardiyada: Self-test (30J testi).',
            'Günlük: Batarya doluluk kontrolü.',
            'Haftalık: Kaşık temizliği ve jel kontrolü.'
        ]
    },
    'monitör': {
        title: 'Hasta Başı Monitörü',
        safety: [
            'Alarm limitlerini hastanın durumuna göre ayarlayın (Varsayılan bırakmayın).',
            'SpO2 probunun uzun süre aynı parmakta kalması nekroza yol açabilir, yerini değiştirin.',
            'Tansiyon manşonunu doğru boyutta seçin.'
        ],
        usage: [
            'EKG, SpO2 ve NIBP kablolarını hastaya bağlayın.',
            'Hasta bilgilerini girin veya barkod okutun.',
            'Dalga formlarının temiz olduğunu kontrol edin.',
            'Tansiyon ölçüm aralığını (Örn: 15 dk) ayarlayın.'
        ],
        maintenance: [
            'Günlük: Ekran ve kablo temizliği.',
            'Aylık: NIBP basınç testi.',
            'Yıllık: Elektriksel güvenlik ve parametre doğrulama.'
        ]
    },
    'infüzyon': {
        title: 'İnfüzyon / Enjektör Pompası',
        safety: [
            'Hortum içinde hava kabarcığı kalmadığından emin olun.',
            'İlaç dozunu ve akış hızını (ml/saat) çift kontrol edin.',
            'Serbest akış kıskacının (Clamp) kapalı olduğunu kontrol edin.'
        ],
        usage: [
            'Seti cihaza yerleştirin ve kapağı kapatın.',
            'Marka/Model set seçimini doğrulayın.',
            'Hızı ve toplam hacmi girin.',
            'Bolus yapacaksanız dikkatli olun.',
            'Start tuşuna basarak infüzyonu başlatın.'
        ],
        maintenance: [
            'Her Kullanım Sonrası: İlaç kalıntısı temizliği.',
            'Aylık: Basınç (Tıkanıklık) sensör testi.',
            'Yıllık: Akış hızı kalibrasyonu.'
        ]
    },
    'küvöz': {
        title: 'Yenidoğan Küvözü (İnkübatör)',
        safety: [
            'Sıcaklık probunu bebeğin cildine (karaciğer üzeri) sağlam yapıştırın.',
            'Su haznesinde sadece steril su kullanın (Bakteri riski).',
            'Kapakları uzun süre açık tutmayın, ısı kaybı olur.'
        ],
        usage: [
            'Cihazı önceden ısıtın.',
            'Nem modunu aktif edin.',
            'Bebeği yatırın ve "Baby Mode" (Servo) veya "Air Mode" seçimini yapın.',
            'Oksijen desteği veriliyorsa oranını monitörize edin.'
        ],
        maintenance: [
            'Haftalık: Tam temizlik ve dezenfeksiyon.',
            '3 Ayda Bir: Hava filtresi değişimi.',
            'Yıllık: Sıcaklık ve nem kalibrasyonu.'
        ]
    },

    // --- KARDİYOLOJİ ---
    'ekg': {
        title: 'EKG Cihazı',
        safety: [
            'Kabloların kırık veya soyulmuş olmadığından emin olun.',
            'Topraklama hatası parazite (artefakt) neden olur.',
            'Cihazı defibrilasyon sırasında korumak için hasta kablosunu çıkarmaya gerek yoktur (Korumalıdır).'
        ],
        usage: [
            'Hastanın göğüs ve ekstremitelerini açın, jeli sürün.',
            'Elektrotları (V1-V6 ve renkli mandallar) doğru yerleştirin.',
            'Cihazdan hasta bilgilerini girin.',
            'Trasenin düzgün olduğunu görünce "Auto" veya "Record" tuşuna basın.',
            'Çıktıyı kontrol edin.'
        ],
        maintenance: [
            'Haftalık: Kablo kopukluk testi.',
            'Aylık: Yazıcı silindir temizliği.',
            'Yıllık: Kalibrasyon ve hız testi.'
        ]
    },
    'holter': {
        title: 'Holter Kayıt Cihazı',
        safety: [
            'Kayıt süresince (24/48 saat) cihazın suyla temas etmemesi gerektiğini hastaya anlatın.',
            'Pillerin tam dolu (veya yeni) olduğundan emin olun.'
        ],
        usage: [
            'Hastanın cildini alkolle temizleyin ve ize bantlarını yapıştırın.',
            'Kabloları bantlarla sabitleyin (Artefaktı önlemek için).',
            'Test kaydı alıp sinyal kalitesine bakın.',
            'Kaydı başlatın ve hastaya "Olay Butonu"nu anlatın.'
        ],
        maintenance: [
            'Her Hasta Dönüşü: Hafıza kartı formatlanmalı ve kablolar temizlenmeli.',
            'Yıllık: Sinyal doğrulama.'
        ]
    },
    'introaortik': {
        title: 'İntraaortik Balon Pompası (IABP)',
        safety: [
            'Helyum tüpünün basıncını sürekli kontrol edin.',
            'EKG tetiklemesinin (Trigger) doğru ayarlandığından emin olun.',
            'Balon kateterinde kan görülmesi balonun patladığını gösterir, derhal durdurun.'
        ],
        usage: [
            'Sistemi açın ve helyum purj (Purge) işlemini yapın.',
            'EKG ve Basınç kablolarını bağlayın.',
            'Asist oranını (1:1, 1:2) belirleyin.',
            'Timing (Şişme/İnme) ayarını diyastol sonuna göre yapın.',
            'Konsolu başlatın.'
        ],
        maintenance: [
            'Her Vaka Sonrası: Nem tutucu hazne kontrolü.',
            'Aylık: Batarya testi.',
            'Yıllık: Pnömatik sistem bakımı.'
        ]
    },

    // --- KBB & GÖZ (ENT & OPHTHALMOLOGY) ---
    'odyometre': {
        title: 'Odyometri (İşitme Testi) Cihazı',
        safety: [
            'Kulaklıkları hastaya takmadan önce ses seviyesini sıfırlayın.',
            'Sessiz kabin dışında yapılan testler güvenilir değildir.',
            'Hasta cevap butonunun çalıştığını kontrol edin.'
        ],
        usage: [
            'Hastaya prosedürü anlatın.',
            'Hava yolu (Kulaklık) ve Kemik yolu (Vibratör) başlıklarını takın.',
            'Frekans (Hz) ve Şiddet (dB) seçimi yaparak sesi gönderin.',
            'Hastanın cevabına göre eşik değerlerini işaretleyin.'
        ],
        maintenance: [
            'Günlük: Biyolojik kalibrasyon (Kendi kulağınızla kontrol).',
            'Günlük: Kulaklık sünger temizliği.',
            'Yıllık: Tam akustik kalibrasyon.'
        ]
    },
    'abr': {
        title: 'ABR / BERA Cihazı',
        safety: [
            'Elektrot empedansı 5 kOhm altında olmalıdır.',
            'Bebek hastalarda cildi tahriş etmemeye özen gösterin.',
            'Ortamdaki elektriksel gürültü kaynaklarını kapatın.'
        ],
        usage: [
            'Cildi jel ile temizleyin ve elektrotları yapıştırın.',
            'Empedans ölçümü yapın.',
            'Insert kulaklıkları yerleştirin.',
            'Testi başlatın ve dalga formlarının tekrarlanabilirliğini kontrol edin.'
        ],
        maintenance: [
            'Haftalık: Kablo kontrolü.',
            'Yıllık: Ses uyaran kalibrasyonu.'
        ]
    },
    'fako': {
        title: 'Fakoemülsifikasyon (Katarakt) Cihazı',
        safety: [
            'Tübing setlerinin steril olduğundan emin olun.',
            'Ultrasonik elceğin (Handpiece) testini mutlaka yapın.',
            'İrrigasyon sıvısının bitmemesine dikkat edin.'
        ],
        usage: [
            'Kaseti cihaza takın ve "Prime" (Hazırlık) işlemini yapın.',
            'Elcek testini (Tune) gerçekleştirin.',
            'Pedal ayarlarını kontrol edin.',
            'Cerrahın komutlarına göre vakum ve güç ayarlarını değiştirin.'
        ],
        maintenance: [
            'Her Vaka Sonrası: Elcek temizliği ve sterilizasyonu.',
            'Aylık: Pedal temizliği.',
            'Yıllık: Ultrasonik güç kalibrasyonu.'
        ]
    },

    // --- LABORATUVAR ---
    'santrifüj': {
        title: 'Masaüstü Santrifüj',
        safety: [
            'DİKKAT: Dengesiz yükleme (Unbalance) cihazın parçalanmasına yol açabilir. Tüpleri karşılıklı eşit ağırlıkta yerleştirin.',
            'Kapak kilitlenmeden cihaz çalışmaz, zorlamayın.',
            'Dönerken kapağı açmaya çalışmayın.'
        ],
        usage: [
            'Tüpleri rotor içine simetrik yerleştirin.',
            'Kapağı kapatın.',
            'RPM (Hız) ve Süre ayarını yapın.',
            'Başlatın. Titreşim varsa hemen durdurun.'
        ],
        maintenance: [
            'Günlük: Dökülen sıvıların temizliği.',
            'Aylık: Rotor çatlak kontrolü.',
            'Yıllık: Hız ve zamanlayıcı doğrulaması.'
        ]
    },
    'kan gazı': {
        title: 'Kan Gazı Analiz Cihazı',
        safety: [
            'Biyolojik atık riski. Atık kabının dolu olmadığını kontrol edin.',
            'Enjektör ucundaki hava kabarcığını mutlaka atın.'
        ],
        usage: [
            'Örnek enjektörünü çalkalayın (Heparin karışımı için).',
            'Tanıtma ucunu açın ve aspirasyonu başlatın.',
            'Örnek alındıktan sonra numuneyi çıkarın.',
            'Sonuçların yazdırılmasını bekleyin.'
        ],
        maintenance: [
            'Günlük: Kalibrasyon ve QC (Kalite Kontrol).',
            'Haftalık: Prob temizliği.',
            'Aylık: Membran değişimleri.'
        ]
    },

    // --- FİZİK TEDAVİ (FTR) ---
    'tens': {
        title: 'TENS / Elekroterapi Cihazı',
        safety: [
            'Kalp pili olan hastalarda göğüs bölgesine uygulama yapmayın.',
            'Hamilelerde karın bölgesine uygulamayın.',
            'Elektrod pedlerinin yapışkanlığını kontrol edin, gevşekse yanık yapabilir.'
        ],
        usage: [
            'Hastaya uygun akım tipini seçin.',
            'Elektrotları ağrı bölgesine yerleştirin.',
            'Akım şiddetini hasta "karıncalanma" hissedene kadar yavaşça artırın (Ağrı sınırına gelmeyin).',
            'Süre bitince otomatik kapanmayı bekleyin.'
        ],
        maintenance: [
            'Günlük: Ped ve kablo kontrolü.',
            'Yıllık: Akım çıkış testleri.'
        ]
    },
    'traksiyon': {
        title: 'Traksiyon Cihazı',
        safety: [
            'Hasta emniyet butonunu eline verin.',
            'Kemerlerin çok sıkı veya gevşek olmadığından emin olun.',
            'Osteoporozlu hastalarda dikkatli olun.'
        ],
        usage: [
            'Hastayı masaya yatırın ve kemerleri bağlayın.',
            'Çekme gücünü (kg) ve modunu (Sürekli/Aralıklı) ayarlayın.',
            'İpi boşluğunu alın ve başlatın.'
        ],
        maintenance: [
            'Haftalık: İp ve kemer sağlamlık kontrolü.',
            'Yıllık: Kuvvet kalibrasyonu.'
        ]
    },

    // --- STERİLİZASYON ---
    'otoklav': {
        title: 'Buharlı Sterilizatör (Otoklav)',
        safety: [
            'DİKKAT: Yüksek Basınç ve Sıcaklık. Program bitmeden ve basınç sıfırlanmadan kapağı açmaya ÇALIŞMAYIN.',
            'Cihazın contalarını (kapak lastiği) her gün kontrol edin.',
            'Bowie-Dick testini her sabah ilk iş olarak yapın.'
        ],
        usage: [
            'Paketleri raflara aralıklı dizin (Buhar geçişi için).',
            'Kapağı kapatın ve kilitleyin.',
            'Uygun programı (121°C / 134°C) seçin.',
            'Döngü bittikten sonra kurutma aşamasını bekleyin.',
            'İndikatörlerin renk değişimini kontrol ederek malzemeyi çıkarın.'
        ],
        maintenance: [
            'Günlük: Kazan filtresi (Drain) temizliği.',
            'Haftalık: Conta temizliği ve vakum testi.',
            'Yıllık: Basınç ve sıcaklık validasyonu.'
        ]
    },
    'yıkama': {
        title: 'Yıkama ve Dezenfeksiyon Cihazı',
        safety: [
            'Kimyasal bidonlarının (Deterjan/Asit) seviyesini kontrol edin.',
            'Sivri aletleri sepete dizerken kendinize dikkat edin.'
        ],
        usage: [
            'Kirli aletleri sepetlere yerleştirin, üst üste gelmemesine dikkat edin.',
            'Fıskiyelerin (Pervane) serbest döndüğünü kontrol edin.',
            'Programı seçin ve başlatın.'
        ],
        maintenance: [
            'Günlük: Filtre temizliği.',
            'Aylık: Pervane temizliği.',
            'Yıllık: Sıcaklık doğrulaması.'
        ]
    },
    'paketleme': {
        title: 'Kapatma (Paketleme) Cihazı',
        safety: [
            'Isıtıcı çenelere dokunmayın, sıcaktır (180°C).',
            'Bıçak ünitesine parmağınızı yaklaştırmayın.'
        ],
        usage: [
            'Cihazı açın ve ısınmasını bekleyin.',
            'Poşeti rezistansın üzerine düzgünce yerleştirin.',
            'Kolu indirin veya otomatik beslemeye verin.',
            'Yapışma yerinde hava kabarcığı veya yanık olmadığını kontrol edin.'
        ],
        maintenance: [
            'Haftalık: Teflon bant kontrolü, yıpranmışsa değiştirin.',
            'Yıllık: Isı ve baskı testi.'
        ]
    },

    // --- GENEL / DİĞER ---
    'tansiyon': {
        title: 'Tansiyon Ölçüm Cihazı',
        safety: [
            'Manşonun içinde hava varken ezmeyin.',
            'Hortumlarda kaçak kontrolü yapın.'
        ],
        usage: [
            'Manşonu hasta koluna (Kalp hizasında) sarın.',
            'Başlat tuşuna basın veya puarı şişirin.',
            'Ölçüm bitince manşonu tamamen indirin.'
        ],
        maintenance: [
            '6 Ayda Bir: Basınç doğrulaması (Cıvalı manometre ile kıyaslama).'
        ]
    },
    'ateş': {
        title: 'Ateş Ölçer (Termometre)',
        safety: [
            'İnfrared sensörün temiz olduğundan emin olun.',
            'Lensi parmaklamayın.'
        ],
        usage: [
            'Prob kılıfını takın (Kulaktan ise) veya alna tutun.',
            'Tuşa basın ve bip sesini bekleyin.',
        ],
        maintenance: [
            'Günlük: Lens temizliği (Alkol ile).'
        ]
    },
    'terazi': {
        title: 'Tıbbi Terazi / Baskül',
        safety: [
            'Düz ve sert bir zeminde olduğundan emin olun.',
            'Maksimum kapasiteyi aşmayın.'
        ],
        usage: [
            'Cihazı açın ve "0.00" görmeden hastayı çıkarmayın.',
            'Hastanın hareket etmemesini sağlayın.',
            'Sabitlenince değeri okuyun.'
        ],
        maintenance: [
            'Yıllık: Kalibrasyon (Referans ağırlıklar ile).'
        ]
    }
}

// Helper to determine best match or generic content
function generateContent(deviceName: string): string {
    const lowerName = deviceName.toLowerCase();

    // Find matching key in knowledge base
    let matchedKey = Object.keys(deviceKnowledgeBase).find(key => lowerName.includes(key));

    // Advanced Synonym Mapping
    if (!matchedKey) {
        // Radiology
        if (lowerName.includes('x-ray') || lowerName.includes('c-kollu') || lowerName.includes('skopi') || lowerName.includes('kemik')) matchedKey = 'röntgen';
        else if (lowerName.includes('doppler') || lowerName.includes('eko')) matchedKey = 'ultrason';

        // Critical Care
        else if (lowerName.includes('aspiratör') || lowerName.includes('vakum')) matchedKey = 'aspiratör'; // Need to add aspirator, or map to pump
        else if (lowerName.includes('cpap') || lowerName.includes('bpap')) matchedKey = 'ventilatör';
        else if (lowerName.includes('pulse') || lowerName.includes('oksijen')) matchedKey = 'monitör';

        // Surgical
        else if (lowerName.includes('ligasure') || lowerName.includes('bipolar') || lowerName.includes('koter')) matchedKey = 'koter';
        else if (lowerName.includes('lamba') || lowerName.includes('ışık')) matchedKey = 'ameliyat lambası';
        else if (lowerName.includes('endovizyon') || lowerName.includes('kamera')) matchedKey = 'mikroskop'; // loose match
        else if (lowerName.includes('turnike')) matchedKey = 'tansiyon'; // pneumatic pressure logic similar

        // Lab & Sterilization
        else if (lowerName.includes('sterilizatör') || lowerName.includes('hidrojen')) matchedKey = 'otoklav';
        else if (lowerName.includes('benmari') || lowerName.includes('inkübatör')) matchedKey = 'küvöz'; // heating logic similar

        // FTR
        else if (lowerName.includes('compex') || lowerName.includes('stimülatör')) matchedKey = 'tens';
        else if (lowerName.includes('hotpack') || lowerName.includes('parafin')) matchedKey = 'küvöz'; // Heat application
    }

    const data = matchedKey ? deviceKnowledgeBase[matchedKey] : null;

    if (data) {
        return `# ${data.title || deviceName} Kullanım ve Bakım Talimatı

## 1. Amaç
Bu talimat, **${deviceName}** cihazının hastanemiz standartlarında güvenli ve verimli kullanımını sağlamak için hazırlanmıştır.

## 2. Güvenlik ve Uyarılar
> [!WARNING]
> **DİKKAT:** Aşağıdaki maddeler hayati önem taşır.

${data.safety.map((s: string) => `*   ${s}`).join('\n')}

## 3. Kullanım Adımları
${data.usage.map((u: string, i: number) => `${i + 1}.  ${u}`).join('\n')}

## 4. Temizlik ve Dezenfeksiyon
*   Cihazı fişten çektikten sonra üretici onaylı dezenfektan (yüzey dezenfektanı) ile siliniz.
*   Ekran ve hassas sensörlere doğrudan sıvı sıkmayınız, beze sıkıp siliniz.
*   Kan veya vücut sıvısı bulaşmışsa enzimatik temizleyici kullanınız.

## 5. Arıza ve Bakım
*   Herhangi bir hata kodu alındığında kodu not edin ve Biyomedikal Birimini arayın.
*   Cihazın periyodik bakım etiketi geçerliliğini korumalıdır.

### Bakım Planı:
${data.maintenance.map((m: string) => `*   ${m}`).join('\n')}
`
    }

    // High quality Generic Fallback
    return `# ${deviceName} Genel Kullanım Talimatı

## 1. Amaç
Bu doküman, **${deviceName}** cihazının genel kullanım prensiplerini içerir. Cihaz spesifik özellikleri için üretici (User Manual) kılavuzuna bakınız.

## 2. Temel Güvenlik
*   Cihazı sadece yetkili personel kullanmalıdır.
*   Elektrik kablosunun bütünlüğünü her kullanım öncesi kontrol edin.
*   Cihazın üzerine sıvı dökülmemesine dikkat edin.
*   Cihaz çalışırken anormal ses veya koku gelirse derhal fişten çekin (şebeke bağlantısını kesin) ve "ARIZALI" etiketi asın.

## 3. Genel Çalıştırma
1.  **Güç:** Cihazı uygun voltajdaki (genellikle UPS hattı) prize takın ve ana şalteri açın.
2.  **Test:** Açılışta cihazın kendini test etmesini (POST) bekleyin. Hata mesajı yoksa kullanıma hazırdır.
3.  **İşlem:** İşlem süresince cihazın göstergelerini takip edin.
4.  **Kapanış:** İşlem bitiminde önce cihaz üzerindeki kapatma düğmesini kullanın, ardından gerekirse fişi çekin.

## 4. Temizlik
*   Nemli ve hafif deterjanlı bez ile dış yüzey temizliği yapın.
*   Aşındırıcı (aseton, tiner vb.) maddeler kullanmayın.

## 5. Bakım ve Arıza
*   Cihaz arızalandığında kendi başınıza tamir etmeye çalışmayın.
*   Yıllık planlı bakımları Biyomedikal Birimi tarafından takip edilir.
`
}

// Map common names to a simpler filename slug
function slugify(text: string): string {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\u00C0-\u017F-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

async function main() {
    const devices = await prisma.device.findMany({
        select: { name: true },
        distinct: ['name']
    })

    const outputDir = path.join(process.cwd(), 'public', 'docs', 'instructions')

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Generating manuals for ${devices.length} distinct device types...`)

    const generatedFiles = []

    for (const device of devices) {
        if (!device.name) continue

        const fileName = `${slugify(device.name)}.md`
        const filePath = path.join(outputDir, fileName)
        const content = generateContent(device.name)

        fs.writeFileSync(filePath, content)
        console.log(`Generated: ${fileName}`)

        generatedFiles.push({
            name: device.name,
            path: `/docs/instructions/${fileName}`
        })
    }

    // OPTIONAL: If we want to verify coverage
    console.log('All manuals generated.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
